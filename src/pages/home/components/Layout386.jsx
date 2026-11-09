"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section, stepNumber } from "../../../lib/content";

// Link targets are code, not content: card position decides where it points.
const cardTargets = ["/kamers", "/over-de-kopstoof", "/kamers"];

function ReasonCard({ item, index }) {
  return (
    <div className="flex flex-col justify-between bg-background p-8 md:p-10">
      <div>
        <span className="font-heading text-5xl font-bold italic text-accent/30">
          {stepNumber(index)}
        </span>
        <h3 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
          {item.titel}
        </h3>
        <p className="mt-3 text-primary/70">{item.tekst}</p>
      </div>
      <Link
        to={cardTargets[index] ?? "/kamers"}
        className="mt-8 flex items-center gap-2 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
      >
        {item.link_tekst} <RxChevronRight />
      </Link>
    </div>
  );
}

export function Layout386() {
  const c = section(home.redenen);
  const items = list(c.items);
  const featured = section(c.uitgelicht);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="max-w-xl font-heading text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-px bg-primary/15 lg:grid-cols-3">
          {items.slice(0, 2).map((item, i) => (
            <ReasonCard key={i} item={item} index={i} />
          ))}

          {/* Featured card — dark, spans 2 rows on large */}
          <div className="relative flex flex-col overflow-hidden bg-primary lg:row-span-2">
            <div className="relative z-10 flex flex-1 flex-col justify-between p-8 md:p-10 lg:p-12">
              <div>
                <p className="overline-text mb-4 text-accent">{featured.overline}</p>
                <h3 className="font-heading text-3xl font-bold italic leading-tight text-cream md:text-4xl lg:text-5xl">
                  {featured.titel}
                </h3>
                <p className="mt-4 text-surface/80">{featured.tekst}</p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/kamers"
                  className="inline-flex items-center gap-2 bg-accent px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
                >
                  {featured.knop}
                </Link>
                <Link
                  to="/over-de-kopstoof"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-surface/70 transition-colors hover:text-surface"
                >
                  {featured.link_tekst} <RxChevronRight />
                </Link>
              </div>
            </div>
            <div className="img-zoom h-56 lg:h-auto lg:flex-1">
              <ContentImage
                image={featured.afbeelding}
                className="size-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            </div>
          </div>

          {items.slice(2).map((item, i) => (
            <ReasonCard key={i + 2} item={item} index={i + 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
