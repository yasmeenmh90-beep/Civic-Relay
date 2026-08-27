"""
Handles image uploads for issue reports.

Real S3 if AWS creds + S3_BUCKET are set. Otherwise falls back to saving
into a local ./uploads folder and serving it back via a static path - so
the whole report flow (including photos) works offline during development.
"""
import os
import uuid
from pathlib import Path

S3_BUCKET = os.getenv("S3_BUCKET", "")
LOCAL_UPLOAD_DIR = Path("uploads")


def s3_available() -> bool:
    return bool(S3_BUCKET) and bool(os.getenv("AWS_ACCESS_KEY_ID"))


def _safe_filename(original_name: str) -> str:
    ext = Path(original_name).suffix.lower() or ".jpg"
    return f"{uuid.uuid4()}{ext}"


def save_image(file_bytes: bytes, original_name: str, content_type: str) -> str:
    """Returns a URL the frontend can render directly in an <img> tag."""
    filename = _safe_filename(original_name)

    if s3_available():
        import boto3

        client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "us-east-1"))
        key = f"issue-images/{filename}"
        client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        region = os.getenv("AWS_REGION", "us-east-1")
        return f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{key}"

    # --- Local/demo fallback ---
    LOCAL_UPLOAD_DIR.mkdir(exist_ok=True)
    path = LOCAL_UPLOAD_DIR / filename
    path.write_bytes(file_bytes)
    return f"/uploads/{filename}"
