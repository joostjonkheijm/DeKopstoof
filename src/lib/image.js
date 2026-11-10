// Responsive image URLs via Netlify Image CDN.
//
// Owners upload phone photos of 5–10 MB. Netlify resizes them on demand and
// serves AVIF/WebP where the browser supports it, so the originals never
// reach visitors.
//
// The CDN only exists on Netlify (and `netlify dev`). It is switched on with
// VITE_IMAGE_CDN=on, which netlify.toml sets for Netlify builds. Everywhere
// else (npm run dev, vite preview) images load straight from /images/uploads.

const enabled = import.meta.env.VITE_IMAGE_CDN === "on";

/** Widths offered to the browser; it picks the smallest that fits. */
export const WIDTHS = [480, 800, 1200, 1600, 2000];
const FALLBACK_WIDTH = 1200;
const QUALITY = 75;

// Only local raster uploads go through the CDN. SVGs and external URLs pass through.
const transformable = (src) =>
  enabled && typeof src === "string" && src.startsWith("/") && !/\.svg($|\?)/i.test(src);

const cdnUrl = (src, width) =>
  `/.netlify/images?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;

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
