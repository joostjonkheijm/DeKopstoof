"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

export function Layout1() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div>
            <p className="overline-text mb-4 text-accent">Welkom</p>
            <h2 className="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Heerlijk genieten van rust en natuur
            </h2>
            <p className="mt-5 text-primary/70 md:text-lg">
              Wij vinden het leuk u te mogen ontvangen in onze B&amp;B. Kom
              genieten van de rust en de natuur om u heen. Onze B&amp;B heeft
              meerdere zitjes in de tuin, een sauna met aparte rustruimte en een
              bank aan het water, waar je heerlijk kunt genieten van de laatste
              zonnestralen.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/kamers"
                className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
              >
                Meer over ons
              </Link>
              <Link
                to="/kamers"
                className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
              >
                Boek je verblijf <RxChevronRight />
              </Link>
            </div>
          </div>
          <div className="img-zoom overflow-hidden">
            <img
              src="/images/about-story.jpg"
              className="aspect-[4/3] w-full object-cover"
              alt="De eigenaren van De Kopstoof"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
