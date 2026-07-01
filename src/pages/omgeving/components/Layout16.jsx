"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

const highlights = [
  "Gouda voor kaas, grachten en middeleeuws karakter",
  "Schoonhoven voor zilver en historische vestingstad",
  "Oudewater met heksenwaagsmuseum en 15e-eeuwse kern",
  "Kinderdijk voor molens en het Alblasserwaard-landschap",
  "Rotterdam voor skyline, bruggen en moderne architectuur",
];

export function Layout16() {
  return (
    <section className="bg-primary px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div>
            <p className="overline-text mb-4 text-accent">Uitstappen</p>
            <h2 className="font-heading text-4xl font-bold italic leading-tight text-cream md:text-5xl lg:text-6xl">
              Steden die u niet mag missen
            </h2>
            <p className="mt-5 text-surface/80 md:text-lg">
              Gouda, Schoonhoven en Oudewater zijn prachtige kleine stadjes met
              middeleeuws karakter. Kinderdijk en Rotterdam liggen ook voor de
              deur. Elk heeft zijn eigen verhaal — en u bent voor het avondeten
              terug.
            </p>
            <ul className="mt-6 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <span className="text-surface/80">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/kamers"
                className="bg-accent px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                Plannen
              </Link>
              <Link
                to="/omgeving"
                className="flex items-center gap-1 font-body text-sm font-semibold text-surface/70 transition-colors hover:text-surface"
              >
                Alle tips <RxChevronRight />
              </Link>
            </div>
          </div>
          <div className="img-zoom overflow-hidden">
            <img
              src="/images/surroundings.jpg"
              className="aspect-[4/3] w-full object-cover"
              alt="Polderlandschap Zuid-Holland"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
