"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

export function Layout374() {
  const c = section(home.inbegrepen);
  const featured = section(c.uitgelicht);
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-lg text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured: Breakfast — spans 2 columns × 2 rows */}
          <div className="relative flex flex-col overflow-hidden bg-background sm:col-span-2 sm:row-span-2">
            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
              <p className="overline-text mb-3 text-accent">{featured.tag}</p>
              <h3 className="font-heading text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                {featured.titel}
              </h3>
              <p className="mt-4 max-w-sm text-primary/70">{featured.tekst}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/kamers"
                  className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  {featured.knop}
                </Link>
                <Link
                  to="/kamers"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
                >
                  {featured.link_tekst} <RxChevronRight />
                </Link>
              </div>
            </div>
            <div className="img-zoom flex-1">
              <ContentImage
                image={featured.afbeelding}
                className="size-full min-h-[280px] object-cover"
              />
            </div>
          </div>

          {/* Small cards */}
          {list(c.kaarten).map((card, i) => (
            <div key={i} className="flex flex-col overflow-hidden bg-background">
              <div className="p-6">
                <p className="overline-text mb-2 text-accent">{card.tag}</p>
                <h3 className="font-heading text-xl font-bold md:text-2xl">
                  {card.titel}
                </h3>
                <p className="mt-2 text-sm text-primary/70">{card.tekst}</p>
              </div>
              <div className="img-zoom mt-auto">
                <ContentImage
                  image={card.afbeelding}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-video w-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
