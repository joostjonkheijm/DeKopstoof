"use client";

import React from "react";
import { Link } from "react-router-dom";
import page from "../../../content/kamers.json";
import { ContentImage } from "../../../components/ContentImage";
import { links, section } from "../../../lib/content";

export function Header65() {
  const c = section(page.header);
  return (
    <section className="relative flex min-h-[60vh] items-end overflow-hidden lg:min-h-[70vh]">
      {/* Background image */}
      <div className="absolute inset-0">
        <ContentImage
          image={c.afbeelding}
          fallbackAlt={c.titel}
          className="size-full object-cover"
        />
        {/* Rich gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-[5%] pb-16 md:pb-20 lg:pb-24">
        <div className="container max-w-2xl">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h1 className="font-heading text-4xl font-bold italic leading-tight text-cream md:text-6xl lg:text-7xl">
            {c.titel}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-surface/80">{c.intro}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/kamers"
              className="inline-flex items-center bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
            >
              {c.knop}
            </Link>
            {c.whatsapp_knop && (
              <a
                href={links.whatsapp}
                className="inline-flex items-center border border-surface/40 px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
              >
                {c.whatsapp_knop}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
