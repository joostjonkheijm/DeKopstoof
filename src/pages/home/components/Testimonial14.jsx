"use client";

import React from "react";
import { BiSolidStar } from "react-icons/bi";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

export function Testimonial14() {
  const c = section(home.quote);
  return (
    <section className="bg-primary px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Image side */}
          <div className="order-last md:order-first">
            <div className="img-zoom relative overflow-hidden">
              <ContentImage
                image={c.afbeelding}
                className="aspect-[4/3] w-full object-cover"
              />
              {/* Accent border */}
              <div className="absolute bottom-0 left-0 h-1 w-2/3 bg-accent" />
            </div>
            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-px bg-surface/20">
              {list(c.cijfers).map((stat, i) => (
                <div key={i} className="bg-primary-light p-5 text-center">
                  <p className="font-heading text-3xl font-bold italic text-cream">
                    {stat.waarde}
                  </p>
                  <p className="mt-1 font-body text-xs uppercase tracking-wider text-surface/60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote side */}
          <div className="flex flex-col items-start">
            {/* Stars */}
            <div className="mb-6 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <BiSolidStar key={s} className="size-5 fill-accent text-accent" />
              ))}
            </div>

            {/* Decorative open-quote */}
            <span className="mb-2 font-heading text-7xl leading-none text-accent/30">
              "
            </span>

            <blockquote className="font-heading text-2xl font-bold italic leading-relaxed text-cream md:text-3xl">
              {c.citaat}
            </blockquote>

            <div className="mt-8 flex items-center gap-5">
              <div className="h-10 w-px bg-accent/40" />
              <div>
                <p className="font-body font-semibold text-cream">{c.naam}</p>
                <p className="font-body text-sm text-surface/60">{c.plaats}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
