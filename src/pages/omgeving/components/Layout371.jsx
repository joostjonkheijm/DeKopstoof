"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

const activities = [
  { tag: "Fietsen", title: "Kilometers vlak terrein door polderland", image: "/images/surroundings-water.jpg" },
  { tag: "Wandelen", title: "Voetpaden langs water en weilanden", image: "/images/surroundings.jpg" },
  { tag: "Varen", title: "Kanotochten over de Hollandse rivieren", image: "/images/gallery-garden.jpg" },
];

export function Layout371() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Ontdekken</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Wat de polder u biedt
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Elk seizoen heeft zijn eigen ritme hier.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 sm:grid-cols-3">
          {activities.map((act) => (
            <div key={act.title} className="flex flex-col overflow-hidden bg-background">
              <div className="img-zoom aspect-[4/3] overflow-hidden">
                <img src={act.image} alt={act.title} className="size-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <p className="overline-text mb-2 text-accent">{act.tag}</p>
                <h3 className="font-heading text-xl font-bold md:text-2xl">{act.title}</h3>
                <Link
                  to="/omgeving"
                  className="mt-4 flex items-center gap-1 font-body text-sm font-semibold text-accent"
                >
                  Meer info <RxChevronRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
