"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

export function Layout374() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-lg text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Inbegrepen</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Wat je krijgt
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Alles wat je nodig hebt voor een ontspannen verblijf.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/15 sm:grid-cols-2 lg:grid-cols-4">
          {/* Featured: Breakfast — spans 2 columns × 2 rows */}
          <div className="relative flex flex-col overflow-hidden bg-background sm:col-span-2 sm:row-span-2">
            <div className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
              <p className="overline-text mb-3 text-accent">Ontbijt</p>
              <h3 className="font-heading text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                Vers ontbijt dagelijks
              </h3>
              <p className="mt-4 max-w-sm text-primary/70">
                Yoghurt, vers fruit, broodjes en een gekookt eitje van onze
                eigen kippen. Laat het ons weten bij de reservering of bij
                aankomst als u hiervan gebruik wilt maken.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/kamers"
                  className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  Meer info
                </Link>
                <Link
                  to="/kamers"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
                >
                  Boek nu <RxChevronRight />
                </Link>
              </div>
            </div>
            <div className="img-zoom flex-1">
              <img
                src="/images/gallery-breakfast.jpg"
                alt="Vers ontbijt bij De Kopstoof"
                className="size-full min-h-[280px] object-cover"
              />
            </div>
          </div>

          {/* Small cards */}
          {[
            {
              tag: "Parkeren",
              title: "Gratis parkeerplaats",
              body: "Veilig en dicht bij het huis.",
              img: "/images/gallery-entrance.jpg",
              alt: "Ingang De Kopstoof",
            },
            {
              tag: "WiFi & Werk",
              title: "Snel internet & werkplek",
              body: "Ideaal voor digital nomads en working holidays.",
              img: "/images/gallery-detail.jpg",
              alt: "Gezellige hoek De Kopstoof",
            },
            {
              tag: "Comfort",
              title: "Luxe badkamer",
              body: "Ruime ensuite badkamer met zachte handdoeken.",
              img: "/images/gallery-bathroom.jpg",
              alt: "Luxe badkamer",
            },
            {
              tag: "Tuin",
              title: "Privétuin & terras",
              body: "Meerdere zitjes in de tuin en een bank aan het water — geniet van de laatste zonnestralen.",
              img: "/images/gallery-garden.jpg",
              alt: "Tuin bij De Kopstoof",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex flex-col overflow-hidden bg-background"
            >
              <div className="p-6">
                <p className="overline-text mb-2 text-accent">{card.tag}</p>
                <h3 className="font-heading text-xl font-bold md:text-2xl">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-primary/70">{card.body}</p>
              </div>
              <div className="img-zoom mt-auto">
                <img
                  src={card.img}
                  alt={card.alt}
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
