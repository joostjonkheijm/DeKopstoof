"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

export function Layout13() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div>
            <p className="overline-text mb-4 text-accent">Fietsen</p>
            <h2 className="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Fietsroutes starten voor uw deur
            </h2>
            <p className="mt-5 text-primary/70 md:text-lg">
              Fiets door de Krimpenerwaard of naar de andere kant van de Lek
              richting de molens van Kinderdijk en de Alblasserwaard.
              Knooppuntenroutes liggen klaar, huurfietsen zetten we klaar, en uw
              elektrische fiets laadt u op in onze fietsenschuur.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/kamers"
                className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
              >
                Fietsen huren
              </Link>
              <Link
                to="/omgeving"
                className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
              >
                Route verkennen <RxChevronRight />
              </Link>
            </div>
          </div>
          <div className="img-zoom overflow-hidden">
            <img
              src="/images/surroundings-water.jpg"
              className="aspect-[4/3] w-full object-cover"
              alt="Fietsen langs het water in Lekkerkerk"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
