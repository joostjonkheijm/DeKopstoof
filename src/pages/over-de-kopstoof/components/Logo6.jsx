"use client";

import React from "react";

const stats = [
  { value: "120+", label: "Tevreden gasten" },
  { value: "5.0", label: "Gemiddeld cijfer" },
  { value: "3", label: "Bijzondere kamers" },
  { value: "1850", label: "Jaar van bouw" },
];

export function Logo6() {
  return (
    <section className="bg-primary px-[5%] py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-2 gap-px bg-cream/10 md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center gap-1 bg-primary px-6 py-8 text-center"
            >
              <p className="font-heading text-4xl font-bold italic text-accent md:text-5xl">
                {s.value}
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
