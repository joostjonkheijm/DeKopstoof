"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import page from "../../../content/kamers.json";
import { ContentImage } from "../../../components/ContentImage";
import { Markdown } from "../../../components/Markdown";
import { section } from "../../../lib/content";

export function Layout358() {
  const c = section(page.kamer);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 md:grid-cols-2">
          {/* Text side */}
          <div className="flex flex-col justify-center bg-primary p-8 md:p-12 lg:p-16">
            <p className="overline-text mb-4 text-accent">{c.tag}</p>
            <h3 className="font-heading text-3xl font-bold italic leading-tight text-cream md:text-4xl lg:text-5xl">
              {c.subtitel}
            </h3>
            <Markdown className="mt-5 text-surface/80">{c.tekst}</Markdown>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/boeken"
                className="bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
{c.knop}
              </Link>
              <Link
                to="/boeken"
                className="flex items-center gap-1 font-body text-sm font-semibold text-surface/70 transition-colors hover:text-surface"
              >
{c.link_tekst} <RxChevronRight />
              </Link>
            </div>
          </div>

          {/* Image side */}
          <div className="img-zoom min-h-[350px] overflow-hidden">
            <ContentImage image={c.afbeelding} className="size-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
