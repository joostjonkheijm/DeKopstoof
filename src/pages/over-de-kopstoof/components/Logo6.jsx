"use client";

import React from "react";
import page from "../../../content/over-de-kopstoof.json";
import { list, section } from "../../../lib/content";

export function Logo6() {
  return (
    <section className="bg-primary px-[5%] py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-px bg-cream/10 md:grid-cols-4">
          {list(section(page.cijfers).items).map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-1 bg-primary px-6 py-8 text-center"
            >
              <p className="font-heading text-4xl font-bold italic text-accent md:text-5xl">
                {s.waarde}
              </p>
              <p className="font-body text-xs uppercase tracking-widest text-cream/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
