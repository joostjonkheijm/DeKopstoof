import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadImage(cdn) {
  vi.resetModules();
  if (cdn === undefined) vi.stubEnv("VITE_IMAGE_CDN", "");
  else vi.stubEnv("VITE_IMAGE_CDN", cdn);
  return import("./image.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("responsiveImage with the CDN on", () => {
  it("routes local photos through Cloudflare Image Transformations", async () => {
    const { responsiveImage } = await loadImage("on");
    expect(responsiveImage("/images/uploads/a b.jpg", "100vw").src).toBe(
      "/cdn-cgi/image/width=1200,quality=75,format=auto/images/uploads/a%20b.jpg",
    );
  });

  it("offers five widths in srcSet", async () => {
    const { responsiveImage } = await loadImage("on");
    expect(responsiveImage("/images/uploads/a.jpg", "100vw").srcSet.split(", ")).toHaveLength(5);
  });

  it("passes SVGs through unchanged", async () => {
    const { responsiveImage } = await loadImage("on");
    expect(responsiveImage("/logo.svg", "x")).toEqual({ src: "/logo.svg" });
  });

  it("passes external URLs through unchanged", async () => {
    const { responsiveImage } = await loadImage("on");
    expect(responsiveImage("https://x.nl/a.jpg", "x")).toEqual({ src: "https://x.nl/a.jpg" });
  });
});

describe("responsiveImage with the CDN off", () => {
  it("returns the original URL when VITE_IMAGE_CDN is unset", async () => {
    const { responsiveImage } = await loadImage(undefined);
    expect(responsiveImage("/images/uploads/a.jpg", "x")).toEqual({ src: "/images/uploads/a.jpg" });
  });
});
