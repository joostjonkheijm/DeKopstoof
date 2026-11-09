import React from "react";

/**
 * Renders a CMS image field ({ src, alt }). Renders nothing when the image
 * is missing, so a removed photo never produces a broken <img>.
 */
export function ContentImage({ image, fallbackAlt = "", ...props }) {
  if (!image?.src) return null;
  return <img src={image.src} alt={image.alt || fallbackAlt} {...props} />;
}
