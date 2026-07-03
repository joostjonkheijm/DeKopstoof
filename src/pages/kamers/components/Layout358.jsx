"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

export function Layout358() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Favoriet</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            De kamer
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Uitzicht op het groene hart van Lekkerkerk.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 md:grid-cols-2">
          {/* Text side */}
          <div className="flex flex-col justify-center bg-primary p-8 md:p-12 lg:p-16">
            <p className="overline-text mb-4 text-accent">Ruimte</p>
            <h3 className="font-heading text-3xl font-bold italic leading-tight text-cream md:text-4xl lg:text-5xl">
              Waar rust en ruimte samenkomen
            </h3>
            <p className="mt-5 text-surface/80">
              Hoge ramen brengen het landschap naar binnen. Originele houten
              balken herinneren aan de geschiedenis van dit huis. Een plek waar
              je werkelijk tot jezelf komt.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/boeken"
                className="bg-accent px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
              >
                Boeken
              </Link>
              <Link
                to="/boeken"
                className="flex items-center gap-1 font-body text-sm font-semibold text-surface/70 transition-colors hover:text-surface"
              >
                Meer details <RxChevronRight />
              </Link>
            </div>
          </div>

          {/* Image side */}
          <div className="img-zoom min-h-[350px] overflow-hidden">
            <img
              src="/images/room-garden.jpg"
              className="size-full object-cover"
              alt="Tuin kamer De Kopstoof"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
