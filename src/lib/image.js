// Responsive image URLs via Cloudflare Image Transformations.
//
// Owners upload phone photos of 5–10 MB. Cloudflare resizes them on demand
// through /cdn-cgi/image/ and serves AVIF/WebP where the browser supports it,
// so the originals never reach visitors.
//
// Image Transformations only work on the bnbdekopstoof.nl zone. VITE_IMAGE_CDN=on
// is therefore set only in the Cloudflare Pages Production environment.
// Previews, *.pages.dev and local dev (npm run dev, vite preview) load the
// originals straight from /images/uploads.

const enabled = import.meta.env.VITE_IMAGE_CDN === "on";

/** Widths offered to the browser; it picks the smallest that fits. */
export const WIDTHS = [480, 800, 1200, 1600, 2000];
const FALLBACK_WIDTH = 1200;
const QUALITY = 75;

// Only local raster uploads go through the CDN. SVGs and external URLs pass through.
const transformable = (src) =>
  enabled && typeof src === "string" && src.startsWith("/") && !/\.svg($|\?)/i.test(src);

// Cloudflare transformation options go in the path; the source path follows as-is.
const cdnUrl = (src, width) =>
  `/cdn-cgi/image/width=${width},quality=${QUALITY},format=auto${encodeURI(src)}`;

/**
 * Returns the attributes for an <img>: always `src`, plus `srcSet` and
 * `sizes` when the CDN is active.
 */
export function responsiveImage(src, sizes) {
  if (!transformable(src)) return { src };
  return {
    src: cdnUrl(src, FALLBACK_WIDTH),
    srcSet: WIDTHS.map((w) => `${cdnUrl(src, w)} ${w}w`).join(", "),
    sizes,
  };
}
