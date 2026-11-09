"use client";

import React from "react";
import { BiSolidStar } from "react-icons/bi";
import page from "../../../content/kamers.json";
import { ContentImage } from "../../../components/ContentImage";
import { section } from "../../../lib/content";

export function Testimonial13() {
  const c = section(page.quote);
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Image */}
          <div className="order-last md:order-first">
            <div className="img-zoom overflow-hidden">
              <ContentImage
                image={c.afbeelding}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>

          {/* Quote */}
          <div className="flex flex-col items-start">
            <div className="mb-6 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <BiSolidStar key={s} className="size-5 fill-accent text-accent" />
              ))}
            </div>
            <span className="mb-2 font-heading text-6xl leading-none text-accent/20">"</span>
            <blockquote className="font-heading text-xl font-bold italic leading-relaxed md:text-2xl">
              {c.citaat}
            </blockquote>
            <div className="mt-8 flex items-center gap-5">
              <div className="h-10 w-px bg-accent/30" />
              <div>
                <p className="font-body font-semibold text-primary">{c.naam}</p>
                <p className="font-body text-sm text-primary/60">{c.plaats}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
