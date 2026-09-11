// Client-safe image URL resolution. Kept out of `@/lib/s3` on purpose: that
// module pulls in the AWS SDK and reads server-only credentials, so client
// components must not import it.

const DEFAULT_PUBLIC_BASE_URL =
  "https://s3-xzopnmtqzetpcjcdqpv0s3j8.shubhamjha.live/pyq-images/uploads";

// `NEXT_PUBLIC_` so the value is inlined into the client bundle at build time.
const PUBLIC_BASE_URL = (
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL
).replace(/\/+$/, "");

/**
 * Resolves whatever is stored in the DB to a loadable image URL.
 *
 * Handles every shape the `imageName` / `thumbnailId` columns hold, since rows
 * predating the move to object storage were never rewritten:
 *   - bare object name   `cmexxa62x0002w96xdkf3b8mn.png`
 *   - legacy local path  `/uploads/cmexxa62x0002w96xdkf3b8mn.png`
 *   - already absolute   `https://…/pyq-images/uploads/…png`
 *   - inline `data:` URL from an unsaved card in the editor
 *
 * Returns "" for empty input so callers can keep using a falsy check.
 */
export function getImageUrl(imageNameOrPath: string | null | undefined): string {
  if (!imageNameOrPath) return "";

  const value = imageNameOrPath.trim();
  if (!value) return "";

  // Already resolvable as-is.
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  // Strip any leading directory segments (`/uploads/x.png`, `uploads/x.png`)
  // and keep only the object name, which is what lives under the S3 prefix.
  const fileName = value.replace(/^\/+/, "").split("/").filter(Boolean).pop();
  if (!fileName) return "";

  return `${PUBLIC_BASE_URL}/${encodeURIComponent(fileName)}`;
}
