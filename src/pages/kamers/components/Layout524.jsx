"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import page from "../../../content/kamers.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

export function Layout524() {
  const c = section(page.inbegrepen);
  const featured = section(c.uitgelicht);
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 lg:grid-cols-2">
          {/* Featured card */}
          <div className="relative flex flex-col justify-end overflow-hidden min-h-[400px]">
            <ContentImage image={featured.afbeelding} className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
            <div className="relative z-10 p-8 md:p-10 lg:p-12">
              <p className="overline-text mb-2 text-accent">{featured.tag}</p>
              <h3 className="font-heading text-3xl font-bold italic text-cream md:text-4xl lg:text-5xl">
                {featured.titel}
              </h3>
              <p className="mt-3 text-surface/80">{featured.tekst}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/kamers"
                  className="border border-surface/40 px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-surface transition-colors hover:border-accent hover:text-accent"
                >
{featured.knop}
                </Link>
                <Link
                  to="/kamers"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
                >
{featured.link_tekst} <RxChevronRight />
                </Link>
              </div>
            </div>
          </div>

          {/* 2×2 grid of small feature cards */}
          <div className="grid grid-cols-2 gap-px bg-primary/10">
            {list(c.kaarten).map((f, i) => (
              <div key={i} className="relative flex flex-col justify-end overflow-hidden min-h-[200px]">
                <ContentImage image={f.afbeelding} fallbackAlt={f.titel} sizes="(min-width: 1024px) 25vw, 50vw" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                <div className="relative z-10 p-5">
                  <h3 className="font-heading text-base font-bold text-cream md:text-lg">
                    {f.titel}
                  </h3>
                  <p className="mt-1 text-xs text-surface/70">{f.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
