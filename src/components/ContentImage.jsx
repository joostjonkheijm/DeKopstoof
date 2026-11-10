import React from "react";
import { responsiveImage } from "../lib/image";

// Most photos sit in a two-column layout that stacks on mobile.
const DEFAULT_SIZES = "(min-width: 768px) 50vw, 100vw";

/**
 * Renders a CMS image field ({ src, alt }) as a responsive, lazy-loaded
 * <img>. Renders nothing when the image is missing, so a removed photo never
 * produces a broken <img>.
 *
 * - `sizes`: how wide the image is shown, so the browser picks a fitting file.
 * - `priority`: for the first image on a page; loads it immediately.
 */
export function ContentImage({
  image,
  fallbackAlt = "",
  sizes = DEFAULT_SIZES,
  priority = false,
  ...props
}) {
  if (!image?.src) return null;
  return (
    <img
      {...responsiveImage(image.src, sizes)}
      alt={image.alt || fallbackAlt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      {...props}
    />
  );
}
