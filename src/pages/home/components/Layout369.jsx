"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

// Link targets are code, not content: card position decides where it points.
const cardTargets = ["/omgeving", "/omgeving", "/kamers"];

export function Layout369() {
  const c = section(home.extras);
  const [wide, ...small] = list(c.kaarten);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-lg text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Wide card — first item */}
          {wide && (
            <div className="col-span-1 grid overflow-hidden bg-background sm:col-span-2 sm:grid-cols-2">
              <div className="flex flex-col justify-center p-8">
                <p className="overline-text mb-3 text-accent">{wide.tag}</p>
                <h3 className="font-heading text-2xl font-bold md:text-3xl">
                  {wide.titel}
                </h3>
                <p className="mt-3 text-primary/70">{wide.tekst}</p>
                <Link
                  to={cardTargets[0]}
                  className="mt-6 flex items-center gap-1 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
                >
                  {wide.link_tekst} <RxChevronRight />
                </Link>
              </div>
              <div className="img-zoom">
                <ContentImage
                  image={wide.afbeelding}
                  className="size-full min-h-[220px] object-cover"
                />
              </div>
            </div>
          )}

          {/* Small cards — remaining items */}
          {small.map((card, i) => (
            <div key={i} className="flex flex-col overflow-hidden bg-background">
              <div className="p-6 md:p-8">
                <p className="overline-text mb-2 text-accent">{card.tag}</p>
                <h3 className="font-heading text-xl font-bold md:text-2xl">
                  {card.titel}
                </h3>
                <p className="mt-2 text-sm text-primary/70">{card.tekst}</p>
                <Link
                  to={cardTargets[i + 1] ?? "/omgeving"}
                  className="mt-5 flex items-center gap-1 font-body text-sm font-semibold text-accent"
                >
                  {card.link_tekst} <RxChevronRight />
                </Link>
              </div>
              <div className="img-zoom mt-auto">
                <ContentImage
                  image={card.afbeelding}
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
