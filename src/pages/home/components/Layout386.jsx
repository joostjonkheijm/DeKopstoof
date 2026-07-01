"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

const reasons = [
  {
    number: "01",
    title: "Rechtstreeks boeken is voordeliger",
    body: "Geen commissies of verborgen boekingskosten. Je betaalt de puurste prijs, zonder omwegen.",
  },
  {
    number: "02",
    title: "Gastvrijheid op maat",
    body: "Heb je speciale wensen, allergieën of wil je iemand verrassen? We staan persoonlijk voor je klaar om alles te regelen.",
  },
];

export function Layout386() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <p className="overline-text mb-4 text-accent">Waarom direct</p>
          <h2 className="max-w-xl font-heading text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
            Beter dan platforms
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-px bg-primary/15 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="flex flex-col justify-between bg-background p-8 md:p-10">
            <div>
              <span className="font-heading text-5xl font-bold italic text-accent/30">
                {reasons[0].number}
              </span>
              <h3 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
                {reasons[0].title}
              </h3>
              <p className="mt-3 text-primary/70">{reasons[0].body}</p>
            </div>
            <Link
              to="/kamers"
              className="mt-8 flex items-center gap-2 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Meer weten <RxChevronRight />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between bg-background p-8 md:p-10">
            <div>
              <span className="font-heading text-5xl font-bold italic text-accent/30">
                {reasons[1].number}
              </span>
              <h3 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
                {reasons[1].title}
              </h3>
              <p className="mt-3 text-primary/70">{reasons[1].body}</p>
            </div>
            <Link
              to="/over-de-kopstoof"
              className="mt-8 flex items-center gap-2 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Meer weten <RxChevronRight />
            </Link>
          </div>

          {/* Featured card — dark, spans 2 rows on large */}
          <div className="relative flex flex-col overflow-hidden bg-primary lg:row-span-2">
            <div className="relative z-10 flex flex-1 flex-col justify-between p-8 md:p-10 lg:p-12">
              <div>
                <p className="overline-text mb-4 text-accent">Garantie</p>
                <h3 className="font-heading text-3xl font-bold italic leading-tight text-cream md:text-4xl lg:text-5xl">
                  Altijd de beste prijs
                </h3>
                <p className="mt-4 text-surface/80">
                  Bij een directe boeking krijg je gegarandeerd de scherpste prijs.
                  Elders goedkoper gezien? Wij compenseren het verschil.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/kamers"
                  className="inline-flex items-center gap-2 bg-accent px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
                >
                  Reserveren
                </Link>
                <Link
                  to="/over-de-kopstoof"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-surface/70 transition-colors hover:text-surface"
                >
                  Meer <RxChevronRight />
                </Link>
              </div>
            </div>
            <div className="img-zoom h-56 lg:h-auto lg:flex-1">
              <img
                src="/images/gallery-lounge.jpg"
                alt="Sfeervolle woonkamer De Kopstoof"
                className="size-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between bg-background p-8 md:p-10">
            <div>
              <span className="font-heading text-5xl font-bold italic text-accent/30">
                03
              </span>
              <h3 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
                Direct en persoonlijk contact
              </h3>
              <p className="mt-3 text-primary/70">
                Bel, mail of app ons gerust. Bij ons geen chatbots of
                ingewikkelde formulieren, maar gewoon echt contact.
              </p>
            </div>
            <Link
              to="/kamers"
              className="mt-8 flex items-center gap-2 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
            >
              Contact <RxChevronRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
