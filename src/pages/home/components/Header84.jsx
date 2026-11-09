"use client";

import React from "react";
import { Link } from "react-router-dom";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { links, section } from "../../../lib/content";

export function Header84() {
  const c = section(home.hero);
  return (
    <section className="relative flex min-h-[92vh] flex-col lg:flex-row overflow-hidden">
      {/* Left: dark panel */}
      <div className="relative z-10 flex w-full flex-col justify-center bg-primary px-8 py-20 md:px-16 lg:w-[48%] lg:py-28">
        {/* Terracotta accent line */}
        <div className="mb-8 h-px w-12 bg-accent" />
        {/* Overline */}
        <p className="overline-text mb-6 text-accent">{c.overline}</p>
        {/* Main heading */}
        <h1 className="mb-6 font-heading text-4xl font-bold italic leading-[1.1] text-cream md:text-6xl lg:text-7xl">
          {c.titel}
        </h1>
        {/* Divider */}
        <div className="mb-6 h-px w-full max-w-xs bg-accent/30" />
        {/* Body */}
        <p className="mb-10 max-w-md text-surface/85 md:text-lg">{c.tekst}</p>
        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/kamers"
            className="inline-flex items-center gap-2 bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors duration-300 hover:bg-accent-light"
          >
            {c.knop}
          </Link>
          <a
            href={links.whatsapp}
            className="inline-flex items-center gap-2 border border-surface/40 px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            {c.whatsapp_knop}
          </a>
        </div>
        {/* Bottom badge */}
        <div className="mt-16 flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="size-4 fill-accent" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="font-body text-sm text-surface/70">{c.badge}</p>
        </div>
      </div>

      {/* Right: image */}
      <div className="relative h-[60vw] w-full lg:h-auto lg:flex-1">
        <ContentImage
          image={c.afbeelding}
          className="absolute inset-0 size-full object-cover"
        />
        {/* Warm gradient connecting to left panel */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-transparent to-transparent" />
        {/* Bottom info chip */}
        <div className="absolute bottom-8 right-8 bg-primary/80 px-5 py-3 backdrop-blur-sm">
          <p className="font-body text-xs uppercase tracking-widest text-surface/80">
            {c.chip_titel}
          </p>
          <p className="font-heading text-lg font-bold italic text-cream">
            {c.chip_plaats}
          </p>
        </div>
      </div>
    </section>
  );
}
