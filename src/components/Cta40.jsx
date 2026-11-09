"use client";

import React from "react";
import { Link } from "react-router-dom";
import { ContentImage } from "./ContentImage";
import { links, section, site } from "../lib/content";

export function Cta40() {
  const c = section(site.cta);
  const price = section(c.prijs);
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 overflow-hidden lg:grid-cols-2">
          {/* Left: text */}
          <div className="flex flex-col justify-center bg-primary p-10 md:p-14 lg:p-16">
            <p className="overline-text mb-4 text-accent">{c.overline}</p>
            <h2 className="font-heading text-4xl font-bold italic leading-tight text-cream md:text-5xl lg:text-6xl">
              {c.titel}
            </h2>
            <p className="mt-5 max-w-sm text-surface/80">{c.tekst}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/boeken"
                className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                {c.knop}
              </Link>
              <a
                href={links.whatsapp}
                className="inline-flex items-center border border-surface/30 px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
              >
                {c.whatsapp_knop}
              </a>
            </div>
            <p className="mt-6 font-body text-xs text-surface/50">{c.voorwaarden}</p>
          </div>

          {/* Right: image */}
          <div className="img-zoom relative min-h-[320px]">
            <ContentImage
              image={c.afbeelding}
              className="absolute inset-0 size-full object-cover"
            />
            {/* Price chip */}
            {price.bedrag && (
              <div className="absolute bottom-8 left-8 bg-background/90 px-5 py-4 backdrop-blur-sm">
                <p className="font-body text-xs uppercase tracking-wider text-accent">
                  {price.label}
                </p>
                <p className="font-heading text-4xl font-bold text-primary">
                  {price.bedrag}
                </p>
                <p className="font-body text-xs text-primary/60">
                  {price.toelichting}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
