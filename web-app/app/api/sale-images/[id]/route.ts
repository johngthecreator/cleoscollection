import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const publicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL;
const endpoint = publicBaseUrl
  ? new URL(publicBaseUrl).origin
  : process.env.MINIO_ENDPOINT_URL;

const s3 = new S3Client({
  endpoint,
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    return new Response("Invalid sale ID", { status: 400 });
  }

  try {
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.MINIO_BUCKET!,
        Key: `sales/${id}`,
      }),
    );

    if (!object.Body) {
      return new Response("Image not found", { status: 404 });
    }

    const bytes = await object.Body.transformToByteArray();

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=0",
        "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "NoSuchKey" || error.name === "NotFound")
    ) {
      return new Response("Image not found", { status: 404 });
    }

    console.error("Failed to load sale image", error);
    return new Response("Image unavailable", { status: 502 });
  }
}
