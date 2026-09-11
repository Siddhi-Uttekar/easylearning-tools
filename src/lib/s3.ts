import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// SeaweedFS S3 gateway. Everything the app writes lands under the `uploads/`
// prefix of the bucket, which is the same prefix the 2 843 files migrated off
// the old `public/uploads/` directory live under.
export const UPLOAD_PREFIX = "uploads";

const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME ?? "pyq-images";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  // Warn rather than throw: routes that never upload (PYQ reads, PPT export)
  // must keep working, and `next build` imports every route module.
  console.warn(
    "[s3] S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not all set — uploads will fail.",
  );
}

export const s3Client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint,
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
  // SeaweedFS does not serve virtual-hosted-style buckets — without this the
  // SDK would resolve `https://pyq-images.s3-….shubhamjha.live` and fail DNS.
  forcePathStyle: true,
});

/**
 * Uploads a file to the bucket under `uploads/` and returns its public URL.
 * `fileName` is the bare object name (e.g. `cmexxa62x0002w96xdkf3b8mn.png`).
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const key = `${UPLOAD_PREFIX}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(fileName);
}

/** Public (unauthenticated) URL for an object stored under `uploads/`. */
export function getPublicUrl(fileName: string): string {
  const base = (
    process.env.S3_PUBLIC_BASE_URL ??
    `${endpoint}/${S3_BUCKET_NAME}/${UPLOAD_PREFIX}`
  ).replace(/\/+$/, "");

  return `${base}/${fileName}`;
}
