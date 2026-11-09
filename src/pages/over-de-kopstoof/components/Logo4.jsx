"use client";

import React from "react";
import { BiSolidStar } from "react-icons/bi";
import page from "../../../content/over-de-kopstoof.json";
import { list, section, site } from "../../../lib/content";

export function Logo4() {
  const c = section(page.beoordelingen);
  const platforms = list(site.platforms);
  return (
    <section className="px-[5%] py-16 md:py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-4xl font-bold md:text-5xl lg:text-6xl">
            {c.titel}
          </h2>
          <p className="mt-4 text-primary/70">{c.intro}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-primary/10 md:grid-cols-3">
          {platforms.map((p, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-2 bg-background px-6 py-8 text-center"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <BiSolidStar key={s} className="size-3.5 fill-accent text-accent" />
                ))}
              </div>
              <p className="font-heading text-3xl font-bold text-primary">{p.score}</p>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-accent">
                {p.label}
              </p>
              <p className="font-body text-sm text-primary/50">{p.naam}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
