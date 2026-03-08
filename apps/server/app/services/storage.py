import asyncio
import tempfile
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings


class S3StorageService:
    """S3-compatible storage backed by RustFS."""

    def __init__(self) -> None:
        self._client_instance = None
        self._bucket = settings.S3_BUCKET

    @property
    def _client(self):
        if self._client_instance is None:
            self._client_instance = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                config=Config(signature_version="s3v4"),
            )
        return self._client_instance

    # --- Sync methods ---

    def file_exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except ClientError:
            return False

    def upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def upload_file(self, key: str, path: Path, content_type: str) -> None:
        self._client.upload_file(
            str(path),
            self._bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def download_to_tempfile(self, key: str) -> Path:
        """Download S3 object to a NamedTemporaryFile. Caller must delete the file."""
        suffix = Path(key).suffix
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        try:
            self._client.download_fileobj(self._bucket, key, tmp)
        finally:
            tmp.flush()
            tmp.close()
        return Path(tmp.name)

    # --- Async wrappers ---

    async def async_file_exists(self, key: str) -> bool:
        return await asyncio.to_thread(self.file_exists, key)

    async def async_generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return await asyncio.to_thread(self.generate_presigned_url, key, expires_in)

    async def async_upload_bytes(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(self.upload_bytes, key, data, content_type)

    async def async_download_to_tempfile(self, key: str) -> Path:
        return await asyncio.to_thread(self.download_to_tempfile, key)


storage = S3StorageService()
