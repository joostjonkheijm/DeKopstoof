"use client";

import React from "react";
import { BiWifi, BiBath, BiCar, BiLeaf, BiRestaurant, BiSun } from "react-icons/bi";
import { Link } from "react-router-dom";

const features = [
  { icon: BiLeaf, label: "Tuin & terras" },
  { icon: BiWifi, label: "Gratis wifi" },
  { icon: BiBath, label: "Privé badkamer" },
  { icon: BiRestaurant, label: "Keuken" },
  { icon: BiSun, label: "Uitzicht over de polder" },
  { icon: BiCar, label: "Gratis privé parkeren" },
];

export function Pricing18() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="overline-text mb-4 text-accent">Tarief</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Eerlijke prijs
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Boek rechtstreeks en betaal het beste tarief zonder tussenpersonen.
          </p>

          <div className="mt-12 flex items-baseline justify-center gap-2">
            <span className="font-heading text-7xl font-bold text-primary md:text-8xl">
              €135
            </span>
            <span className="font-body text-lg text-primary/50">/ nacht</span>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px bg-primary/10 md:grid-cols-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 bg-background p-8"
              >
                <Icon className="size-7 text-accent" />
                <span className="font-body text-sm text-primary/70">{label}</span>
              </div>
            ))}
          </div>

          <Link
            to="/boeken"
            className="mt-10 inline-block w-full max-w-sm bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
          >
            Boek nu
          </Link>
        </div>
      </div>
    </section>
  );
}
