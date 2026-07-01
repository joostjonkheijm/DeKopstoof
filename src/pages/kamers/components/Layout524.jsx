"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

const features = [
  {
    title: "Ontbijt van lokale producten",
    body: "Vers brood, kaas en jam van nabije boerderijen.",
    image: "/images/gallery-breakfast.jpg",
  },
  {
    title: "Snelle Wi-Fi en werkplek",
    body: "Verbonden blijven zonder afleiding.",
    image: "/images/gallery-detail.jpg",
  },
  {
    title: "Parkeerplaats op terrein",
    body: "Geen gedoe met zoeken in het dorp.",
    image: "/images/gallery-entrance.jpg",
  },
  {
    title: "Koffie en thee beschikbaar",
    body: "Warme drank wanneer je dat nodig hebt.",
    image: "/images/gallery-lounge.jpg",
  },
];

export function Layout524() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Inbegrepen</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Wat u krijgt bij ons
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Alles wat nodig is voor een onvergetelijk verblijf.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 lg:grid-cols-2">
          {/* Featured card */}
          <div className="relative flex flex-col justify-end overflow-hidden min-h-[400px]">
            <img
              src="/images/room-standard.jpg"
              className="absolute inset-0 size-full object-cover"
              alt="Luxe kamer De Kopstoof"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
            <div className="relative z-10 p-8 md:p-10 lg:p-12">
              <p className="overline-text mb-2 text-accent">Comfort</p>
              <h3 className="font-heading text-3xl font-bold italic text-cream md:text-4xl lg:text-5xl">
                Luxe beddengoed en katoenen lakens
              </h3>
              <p className="mt-3 text-surface/80">
                Fijne kwaliteit waar je lichaam dankbaar voor is.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/kamers"
                  className="border border-surface/40 px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
                >
                  Meer info
                </Link>
                <Link
                  to="/kamers"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
                >
                  Boeken <RxChevronRight />
                </Link>
              </div>
            </div>
          </div>

          {/* 2×2 grid of small feature cards */}
          <div className="grid grid-cols-2 gap-px bg-primary/10">
            {features.map((f) => (
              <div key={f.title} className="relative flex flex-col justify-end overflow-hidden min-h-[200px]">
                <img
                  src={f.image}
                  className="absolute inset-0 size-full object-cover"
                  alt={f.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                <div className="relative z-10 p-5">
                  <h3 className="font-heading text-base font-bold text-cream md:text-lg">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs text-surface/70">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
