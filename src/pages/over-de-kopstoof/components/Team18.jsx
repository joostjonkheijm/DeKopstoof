"use client";

import React from "react";
import page from "../../../content/over-de-kopstoof.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

export function Team18() {
  const c = section(page.team);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mt-5 max-w-md text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 sm:grid-cols-3">
          {list(c.leden).map((member, i) => (
            <div key={i} className="flex flex-col overflow-hidden bg-background">
              <div className="img-zoom aspect-square overflow-hidden">
                <ContentImage image={member.afbeelding} fallbackAlt={member.naam} sizes="(min-width: 640px) 33vw, 100vw" className="size-full object-cover" />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-heading text-xl font-bold">{member.naam}</h3>
                <p className="mt-1 font-body text-sm font-semibold uppercase tracking-wider text-accent">
                  {member.rol}
                </p>
                <p className="mt-3 text-sm text-primary/70">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
