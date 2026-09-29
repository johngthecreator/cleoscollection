"""Download sale images once and store them in the Railway MinIO bucket."""

import os
from io import BytesIO
from pathlib import Path
from urllib.parse import quote, urljoin, urlsplit

import boto3
import requests
from botocore.config import Config
from dotenv import load_dotenv
from PIL import Image, ImageOps, UnidentifiedImageError

load_dotenv(Path(__file__).with_name(".env"))
load_dotenv(Path(__file__).resolve().parents[1] / "web-app" / ".env")

MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000
MAX_IMAGE_DIMENSION = 1200
WEBP_QUALITY = 80
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
IMAGE_TYPES = {
    "image/avif",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
}
REDIRECT_STATUSES = {301, 302, 303, 307, 308}


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Set {name} before running the scraper")
    return value


class ImageStorage:
    def __init__(self):
        self.bucket = required_env("MINIO_BUCKET")
        self.public_base_url = required_env("MINIO_PUBLIC_BASE_URL").rstrip("/")
        self.allowed_hosts = {
            host.strip().lower()
            for host in required_env("IMAGE_ALLOWED_HOSTS").split(",")
            if host.strip()
        }
        if not self.allowed_hosts:
            raise RuntimeError("IMAGE_ALLOWED_HOSTS must contain at least one hostname")

        self.s3 = boto3.client(
            "s3",
            endpoint_url=required_env("MINIO_ENDPOINT_URL"),
            aws_access_key_id=required_env("MINIO_ACCESS_KEY"),
            aws_secret_access_key=required_env("MINIO_SECRET_KEY"),
            region_name="us-east-1",
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                connect_timeout=5,
                read_timeout=30,
                retries={"mode": "standard", "max_attempts": 3},
            ),
        )
        self.s3.head_bucket(Bucket=self.bucket)
        self.http = requests.Session()
        self.http.headers.update({
            "Accept": "image/avif,image/webp,image/png,image/jpeg,image/gif",
            "User-Agent": "CleosCollectionImageImporter/1.0",
        })

    @staticmethod
    def object_key(sale_id: int) -> str:
        # Object names contain only the sale ID, so cleanup never needs to guess an extension.
        return f"sales/{sale_id}"

    def hosted_url(self, sale_id: int) -> str:
        return f"{self.public_base_url}/{quote(self.object_key(sale_id), safe='/')}"

    def _check_source(self, image_url: str) -> str:
        parsed = urlsplit(image_url)
        if (
            parsed.scheme != "https"
            or not parsed.hostname
            or parsed.hostname.lower() not in self.allowed_hosts
            or parsed.username
            or parsed.password
            or parsed.port not in (None, 443)
        ):
            raise ValueError(f"Image URL has a disallowed host: {parsed.hostname}")
        return parsed.hostname

    def download_image(self, image_url: str) -> tuple[bytes, str]:
        url = image_url
        for _ in range(4):
            host = self._check_source(url)
            with self.http.get(
                url,
                stream=True,
                allow_redirects=False,
                timeout=(5, 30),
            ) as response:
                if response.status_code in REDIRECT_STATUSES:
                    location = response.headers.get("Location")
                    if not location:
                        raise RuntimeError(f"Image redirect from {host} has no Location")
                    url = urljoin(url, location)
                    continue

                if not response.ok:
                    raise RuntimeError(f"Image request to {host} returned {response.status_code}")

                content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                if content_type not in IMAGE_TYPES:
                    raise ValueError(f"Unsupported image type from {host}: {content_type}")

                declared_size = response.headers.get("Content-Length", "")
                if declared_size.isdigit() and int(declared_size) > MAX_IMAGE_BYTES:
                    raise ValueError(f"Image from {host} exceeds {MAX_IMAGE_BYTES} bytes")

                body = bytearray()
                for chunk in response.iter_content(chunk_size=64 * 1024):
                    body.extend(chunk)
                    if len(body) > MAX_IMAGE_BYTES:
                        raise ValueError(f"Image from {host} exceeds {MAX_IMAGE_BYTES} bytes")
                if not body:
                    raise ValueError(f"Image from {host} is empty")
                return bytes(body), content_type

        raise RuntimeError("Image URL redirected more than three times")

    def upload_image(self, sale_id: int, body, content_type: str) -> str:
        self.s3.put_object(
            Bucket=self.bucket,
            Key=self.object_key(sale_id),
            Body=body,
            ContentType=content_type,
            CacheControl="public, max-age=604800",
        )
        return self.hosted_url(sale_id)

    @staticmethod
    def optimize_image(body: bytes) -> bytes:
        try:
            with Image.open(BytesIO(body)) as source:
                if source.width * source.height > MAX_IMAGE_PIXELS:
                    raise ValueError("Source image has too many pixels")
                # Use the first frame for animated sources and honor camera orientation.
                source.seek(0)
                image = ImageOps.exif_transpose(source)
                image.thumbnail(
                    (MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS
                )
                if image.mode in ("RGBA", "LA") or "transparency" in image.info:
                    image = image.convert("RGBA")
                    background = Image.new("RGB", image.size, "white")
                    background.paste(image, mask=image.getchannel("A"))
                    image = background
                else:
                    image = image.convert("RGB")

                output = BytesIO()
                image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
                return output.getvalue()
        except (Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
            raise ValueError("Source image has too many pixels") from error
        except (UnidentifiedImageError, OSError) as error:
            raise ValueError("Source image could not be decoded") from error

    def delete_image(self, sale_id: int) -> None:
        self.s3.delete_object(Bucket=self.bucket, Key=self.object_key(sale_id))

    def close(self) -> None:
        self.http.close()
        self.s3.close()
