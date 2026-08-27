"""
Voice Agent: real speech-to-text via Amazon Transcribe, with automatic
language identification so citizens can report in their own language
instead of typing in English.

Requires S3 (Transcribe reads audio from an S3 object, not a raw upload)
and AWS credentials - reuses S3_BUCKET from app/storage.py. Without those
configured, this is skipped entirely (same fallback-gating pattern as every
other AWS-backed feature in this app) - there's no meaningful offline
fallback for "transcribe this audio", unlike the text agents which have a
keyword/template fallback.

Batch transcription jobs aren't instant - this polls for completion with a
timeout, which is fine for the short audio clips a civic issue report would
realistically be (a few seconds to under a minute), but is a real latency
cost worth knowing about: this endpoint can legitimately take 10-30+
seconds to respond.
"""
import os
import time
import uuid
import logging
import requests

logger = logging.getLogger("civicrelay.voice")

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("S3_BUCKET", "")

POLL_INTERVAL_SECONDS = 2
POLL_TIMEOUT_SECONDS = 60

# Amazon Transcribe language codes covering a broad, realistic spread of
# languages a civic reporting app's users might actually speak. Restricting
# to a candidate list (rather than the full ~100 Transcribe supports)
# measurably improves identification accuracy - see LanguageOptions in the
# Transcribe API. Extend this list for your deployment's actual user base.
CANDIDATE_LANGUAGES = [
    "en-US", "es-US", "fr-FR", "de-DE", "pt-BR", "hi-IN",
    "zh-CN", "ar-SA", "ur-PK", "ja-JP", "ko-KR", "ru-RU",
]

CONTENT_TYPE_TO_MEDIA_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "mp4",
    "audio/m4a": "mp4",
    "audio/x-m4a": "mp4",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
}


def voice_available() -> bool:
    return bool(S3_BUCKET) and bool(os.getenv("AWS_ACCESS_KEY_ID"))


def transcribe_audio(audio_bytes: bytes, content_type: str) -> dict | None:
    """
    Returns {"transcript": str, "detected_language": str, "confidence": float}
    on success, or None if unavailable/unsupported format/failed/timed out -
    callers should treat None as "ask the citizen to type instead", there's
    no deterministic fallback for turning audio into text.
    """
    if not voice_available():
        return None

    media_format = CONTENT_TYPE_TO_MEDIA_FORMAT.get(content_type)
    if not media_format:
        logger.warning("Voice Agent: unsupported audio content type: %s", content_type)
        return None

    import boto3

    s3 = boto3.client("s3", region_name=AWS_REGION)
    transcribe = boto3.client("transcribe", region_name=AWS_REGION)

    job_name = f"civicrelay-{uuid.uuid4()}"
    s3_key = f"voice-reports/{job_name}.{media_format}"

    try:
        s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=audio_bytes)

        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={"MediaFileUri": f"s3://{S3_BUCKET}/{s3_key}"},
            MediaFormat=media_format,
            IdentifyLanguage=True,
            LanguageOptions=CANDIDATE_LANGUAGES,
        )

        elapsed = 0
        while elapsed < POLL_TIMEOUT_SECONDS:
            time.sleep(POLL_INTERVAL_SECONDS)
            elapsed += POLL_INTERVAL_SECONDS

            result = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            job = result["TranscriptionJob"]
            status = job["TranscriptionJobStatus"]

            if status == "COMPLETED":
                transcript_uri = job["Transcript"]["TranscriptFileUri"]
                transcript_response = requests.get(transcript_uri, timeout=10)
                transcript_response.raise_for_status()
                transcript_json = transcript_response.json()
                text = transcript_json["results"]["transcripts"][0]["transcript"]

                return {
                    "transcript": text,
                    "detected_language": job.get("LanguageCode", "unknown"),
                    "confidence": job.get("IdentifiedLanguageScore", None),
                }

            if status == "FAILED":
                logger.warning("Voice Agent: transcription job failed: %s", job.get("FailureReason"))
                return None

        logger.warning("Voice Agent: transcription job timed out after %ss", POLL_TIMEOUT_SECONDS)
        return None

    except Exception as exc:
        logger.warning("Voice Agent: transcription failed: %s", exc)
        return None

    finally:
        # Clean up the temporary audio object regardless of outcome -
        # Transcribe has already read it by the time we get here.
        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        except Exception:
            pass
