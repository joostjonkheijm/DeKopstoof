"use client";

import React from "react";
import { BiWifi, BiBath, BiCar, BiCheck, BiLeaf, BiRestaurant, BiSun } from "react-icons/bi";
import { Link } from "react-router-dom";
import page from "../../../content/kamers.json";
import { list, section } from "../../../lib/content";

// Icon keys the owner can pick in the CMS. Unknown keys fall back to a check mark.
const icons = {
  tuin: BiLeaf,
  wifi: BiWifi,
  bad: BiBath,
  keuken: BiRestaurant,
  uitzicht: BiSun,
  parkeren: BiCar,
};

export function Pricing18() {
  const c = section(page.tarief);
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>

          <div className="mt-12 flex items-baseline justify-center gap-2">
            <span className="font-heading text-7xl font-bold text-primary md:text-8xl">
              {c.prijs}
            </span>
            <span className="font-body text-lg text-primary/50">{c.eenheid}</span>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px bg-primary/10 md:grid-cols-3">
            {list(c.kenmerken).map((feature, i) => {
              const Icon = icons[feature.icoon] ?? BiCheck;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 bg-background p-8"
                >
                  <Icon className="size-7 text-accent" />
                  <span className="font-body text-sm text-primary/70">{feature.label}</span>
                </div>
              );
            })}
          </div>

          <Link
            to="/boeken"
            className="mt-10 inline-block w-full max-w-sm bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
          >
            {c.knop}
          </Link>
        </div>
      </div>
    </section>
  );
}
