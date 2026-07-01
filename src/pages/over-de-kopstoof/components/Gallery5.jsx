"use client";

import React from "react";

const images = [
  { src: "/images/about-story.jpg", alt: "De eigenaren van De Kopstoof" },
  { src: "/images/hero-interior.jpg", alt: "Sfeervolle binnenruimte" },
  { src: "/images/gallery-breakfast.jpg", alt: "Vers ontbijt" },
  { src: "/images/gallery-lounge.jpg", alt: "Gezellige woonkamer" },
  { src: "/images/gallery-entrance.jpg", alt: "Sfeervolle ingang" },
  { src: "/images/gallery-detail.jpg", alt: "Details van het huis" },
];

export function Gallery5() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-12 text-center md:mb-16">
          <p className="overline-text mb-4 text-accent">Sfeer</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Een kijkje achter de deuren
          </h2>
          <p className="mt-4 text-primary/70 md:text-lg">
            De warmte en authenticiteit van De Kopstoof in beelden.
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
