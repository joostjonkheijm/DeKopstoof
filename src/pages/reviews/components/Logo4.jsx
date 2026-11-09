"use client";

import React from "react";
import { BiSolidStar } from "react-icons/bi";
import page from "../../../content/reviews.json";
import { list, section, site } from "../../../lib/content";

export function Logo4() {
  const c = section(page.beoordelingen);
  const platforms = list(site.platforms);
  return (
    <section className="bg-surface px-[5%] py-16 md:py-20">
      <div className="container">
        <div className="mb-12 grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="overline-text mb-4 text-accent">{c.overline}</p>
            <h2 className="font-heading text-4xl font-bold italic leading-tight md:text-5xl lg:text-6xl">
              {c.titel}
            </h2>
            <p className="mt-5 text-primary/70 md:text-lg">{c.intro}</p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-primary/10 sm:grid-cols-3">
            {platforms.map((p, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-1.5 bg-background px-4 py-6 text-center"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <BiSolidStar key={s} className="size-3 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-heading text-2xl font-bold text-primary">{p.score}</p>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-accent">
                  {p.label}
                </p>
                <p className="font-body text-xs text-primary/50">{p.naam}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
