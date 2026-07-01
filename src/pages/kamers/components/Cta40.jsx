"use client";

import React from "react";
import { Link } from "react-router-dom";

export function Cta40() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
          {/* Left: text */}
          <div className="flex flex-col justify-center bg-primary p-10 md:p-14 lg:p-16">
            <p className="overline-text mb-4 text-accent">Reserveer nu</p>
            <h2 className="font-heading text-4xl font-bold italic leading-tight text-cream md:text-5xl lg:text-6xl">
              Klaar voor je verblijf?
            </h2>
            <p className="mt-5 max-w-sm text-surface/80">
              Boek direct en ontvang de beste beschikbare prijs. Geen
              commissies, geen omwegen.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/boeken"
                className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                Bekijk beschikbaarheid
              </Link>
              <a
                href="https://wa.me/31182583456"
                className="inline-flex items-center border border-surface/30 px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
              >
                WhatsApp
              </a>
            </div>
            <p className="mt-6 font-body text-xs text-surface/50">
              Door te boeken ga je akkoord met onze voorwaarden en
              privacybeleid.
            </p>
          </div>

          {/* Right: image */}
          <div className="img-zoom relative min-h-[320px]">
            <img
              src="/images/room-deluxe.jpg"
              alt="Deluxe suite De Kopstoof"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Price chip */}
            <div className="absolute bottom-8 left-8 bg-background/90 px-5 py-4 backdrop-blur-sm">
              <p className="font-body text-xs uppercase tracking-wider text-accent">
                Vanaf
              </p>
              <p className="font-heading text-4xl font-bold text-primary">
                €95
              </p>
              <p className="font-body text-xs text-primary/60">
                per nacht, incl. ontbijt
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
