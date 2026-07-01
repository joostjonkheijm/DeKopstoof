"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

const foodHighlights = [
  "Kaasboerderijen in de directe omgeving",
  "Waterfront café met lokale vis",
  "Boerderijwinkel voor rechtstreekse oogst",
];

export function Layout19() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div className="img-zoom overflow-hidden md:order-last">
            <img
              src="/images/gallery-breakfast.jpg"
              className="aspect-[4/3] w-full object-cover"
              alt="Lokale eetgelegenheden in Lekkerkerk"
            />
          </div>
          <div>
            <p className="overline-text mb-4 text-accent">Eten</p>
            <h2 className="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Waar het eten nog van hier komt
            </h2>
            <p className="mt-5 text-primary/70 md:text-lg">
              Kaasboerderijen, lokale restaurants en winkels liggen om de hoek.
              Spreek ons gerust aan voor onze tips, of kijk in het folderrekje
              in de gang — we delen graag onze favorieten.
            </p>
            <ul className="mt-6 space-y-3">
              {foodHighlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="text-primary/80">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/kamers"
                className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
              >
                Onze tips
              </Link>
              <Link
                to="/omgeving"
                className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
              >
                Meer ontdekken <RxChevronRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
