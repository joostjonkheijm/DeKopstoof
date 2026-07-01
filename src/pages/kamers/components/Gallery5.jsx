"use client";

import React from "react";

const images = [
  { src: "/images/room-standard.jpg", alt: "Standaard kamer" },
  { src: "/images/room-garden.jpg", alt: "Tuin kamer" },
  { src: "/images/room-deluxe.jpg", alt: "Deluxe suite" },
  { src: "/images/gallery-lounge.jpg", alt: "Gemeenschappelijke ruimte" },
  { src: "/images/gallery-bathroom.jpg", alt: "Luxe badkamer" },
  { src: "/images/gallery-entrance.jpg", alt: "Sfeervolle ingang" },
];

export function Gallery5() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-12 text-center md:mb-16">
          <p className="overline-text mb-4 text-accent">Impressie</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Fotogalerij kamers
          </h2>
          <p className="mt-4 text-primary/70 md:text-lg">
            Elk vertrek vertelt zijn eigen verhaal door licht en detail.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-primary/10 lg:grid-cols-3">
          {images.map((img, i) => (
            <div key={i} className="img-zoom aspect-square overflow-hidden">
              <img
                src={img.src}
                alt={img.alt}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
