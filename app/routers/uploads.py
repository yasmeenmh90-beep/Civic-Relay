from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request

from app.storage import save_image
from app.agents.vision_agent import analyze_image
from app.agents.voice_agent import voice_available, transcribe_audio
from app.deps import get_current_user
from app.models import User
from app.rate_limit import limiter

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_SIZE_BYTES = 8 * 1024 * 1024  # 8MB

ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/webm", "audio/ogg",
}
MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25MB - generous for a short spoken report


@router.post("/image")
@limiter.limit("10/minute")  # each upload can trigger a real Bedrock vision call - worth protecting
async def upload_image(request: Request, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8MB)")

    url = save_image(contents, file.filename, file.content_type)

    # Real Strands vision call when Bedrock is configured; None (omitted) otherwise.
    # Never blocks or fails the upload itself - vision is an enhancement, not a dependency.
    vision_analysis = analyze_image(contents, file.content_type)

    response = {"image_url": url}
    if vision_analysis:
        response["vision_analysis"] = vision_analysis
    return response


@router.post("/audio")
@limiter.limit("5/minute")  # a real Transcribe job per call - deliberately tighter than image uploads
async def upload_audio(request: Request, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Real speech-to-text via Amazon Transcribe, with automatic language
    identification. Requires S3_BUCKET + AWS credentials - returns 503 with
    a clear message if voice reporting isn't configured on this deployment,
    rather than silently pretending it worked.

    Can take 10-30+ seconds to respond (a real Transcribe batch job, not
    instant) - the frontend should show a "transcribing..." state, not a
    spinner tuned for a typical sub-second request.
    """
    if not voice_available():
        raise HTTPException(
            status_code=503,
            detail="Voice reporting isn't configured on this deployment (requires S3_BUCKET + AWS credentials).",
        )

    if file.content_type not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")

    result = transcribe_audio(contents, file.content_type)
    if not result:
        raise HTTPException(status_code=502, detail="Transcription failed or timed out - please try again or type your report instead.")

    return result
