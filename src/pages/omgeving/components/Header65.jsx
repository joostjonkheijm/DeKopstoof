"use client";

import React from "react";
import { Link } from "react-router-dom";

export function Header65() {
  return (
    <section className="relative flex min-h-[60vh] items-end overflow-hidden lg:min-h-[70vh]">
      <div className="absolute inset-0">
        <img
          src="/images/surroundings-water.jpg"
          className="size-full object-cover"
          alt="Polderlandschap Lekkerkerk"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10" />
      </div>
      <div className="relative z-10 w-full px-[5%] pb-16 md:pb-20 lg:pb-24">
        <div className="container max-w-2xl">
          <p className="overline-text mb-4 text-accent">Ontdekken</p>
          <h1 className="font-heading text-4xl font-bold italic leading-tight text-cream md:text-6xl lg:text-7xl">
            Waar Lekkerkerk leeft
          </h1>
          <p className="mt-5 max-w-lg text-lg text-surface/80">
            Fietsen door polders, eten waar het groeit, en dorpsgezelligheid
            zonder drukte.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/kamers"
              className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
            >
              Boeken
            </Link>
            <a
              href="https://wa.me/31182583456"
              className="inline-flex items-center border border-surface/40 px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
