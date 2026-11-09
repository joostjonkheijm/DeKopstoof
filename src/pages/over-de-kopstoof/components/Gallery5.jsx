"use client";

import React from "react";
import page from "../../../content/over-de-kopstoof.json";
import { list, section } from "../../../lib/content";

export function Gallery5() {
  const c = section(page.galerij);
  // Skip entries without a photo so an empty CMS item never renders a broken image.
  const images = list(c.fotos).filter((img) => img?.src);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-12 text-center md:mb-16">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-4 text-primary/70 md:text-lg">{c.intro}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-primary/10 lg:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="img-zoom aspect-square overflow-hidden">
              <img
                src={img.src}
                alt={img.alt ?? ""}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
