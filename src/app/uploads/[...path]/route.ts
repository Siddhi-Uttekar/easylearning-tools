import { NextRequest, NextResponse } from "next/server";
import { getImageUrl } from "@/lib/images";

/**
 * Compatibility shim for the legacy `/uploads/<file>.png` URLs.
 *
 * `/api/flashcards/all` (and the other public endpoints) return a bare
 * `imageName` — e.g. `cmm3af6ly004l0i6x9zqj0xbr.png` — and consumers we do not
 * control, such as the main easylearning.live site, build their own
 * `https://tools.easylearning.live/uploads/<imageName>` <img> src from it.
 * Those URLs must keep resolving now that new uploads only ever land in the
 * SeaweedFS bucket, so anything not found on disk is redirected there.
 *
 * This is a dynamic route, so it runs *after* Next.js has checked `public/`.
 * Files still present in the mounted `public/uploads` volume therefore keep
 * being served straight off disk, and only the ones that are missing fall
 * through to here. That ordering matters: not every file on the volume is
 * known to exist in the bucket, so a blanket redirect in `next.config.ts`
 * (redirects run *before* the filesystem) would break the ones that are only
 * on disk. Once the volume is fully synced and removed, every request lands
 * here and the behaviour becomes a plain redirect to the bucket.
 */

// Object names are cuid + extension. Anything else is rejected rather than
// interpolated into the redirect target.
const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

function redirectToBucket(request: NextRequest, segments: string[]) {
  const fileName = segments.at(-1);

  if (!fileName || fileName === "." || fileName === ".." || !SAFE_NAME.test(fileName)) {
    return new NextResponse(null, { status: 404 });
  }

  // 302, not 308: a permanent redirect would be cached by browsers
  // indefinitely and we could never move the bucket again.
  return NextResponse.redirect(getImageUrl(fileName), {
    status: 302,
    headers: {
      // Safe to cache — the object name is content-addressed (a fresh cuid per
      // upload), so a given name never points at different bytes.
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return redirectToBucket(request, path);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return redirectToBucket(request, path);
}
