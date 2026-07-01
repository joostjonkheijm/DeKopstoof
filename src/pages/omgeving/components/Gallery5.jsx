"use client";

import React from "react";

const images = [
  { src: "/images/surroundings.jpg", alt: "Polderlandschap Zuid-Holland" },
  { src: "/images/surroundings-water.jpg", alt: "Rivier bij Lekkerkerk" },
  { src: "/images/gallery-garden.jpg", alt: "Groene omgeving" },
  { src: "/images/gallery-entrance.jpg", alt: "Typisch Hollandse architectuur" },
  { src: "/images/hero.jpg", alt: "Omgeving De Kopstoof" },
  { src: "/images/gallery-detail.jpg", alt: "Details van het landschap" },
];

export function Gallery5() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-12 text-center md:mb-16">
          <p className="overline-text mb-4 text-accent">Natuur &amp; Cultuur</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            De omgeving in beeld
          </h2>
          <p className="mt-4 text-primary/70 md:text-lg">
            Alles wat Lekkerkerk en het groene polder te bieden hebben.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-primary/10 lg:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="img-zoom aspect-square overflow-hidden">
              <img src={img.src} alt={img.alt} className="size-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
