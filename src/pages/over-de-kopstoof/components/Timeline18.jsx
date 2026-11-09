"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@relume_io/relume-ui";
import React, { useEffect, useState } from "react";
import page from "../../../content/over-de-kopstoof.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section } from "../../../lib/content";

const useCarouselState = () => {
  const [api, setApi] = useState();
  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrentIndex(api.selectedScrollSnap() + 1));
  }, [api]);

  return { api, setApi, currentIndex };
};

export function Timeline18() {
  const carousel = useCarouselState();
  const c = section(page.verhaal);
  const milestones = list(c.items);
  return (
    <section className="overflow-hidden bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">{c.overline}</p>
          <h2 className="font-heading text-5xl font-bold italic md:text-6xl lg:text-7xl">
            {c.titel}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-primary/70 md:text-lg">{c.intro}</p>
        </div>

        <Carousel
          setApi={carousel.setApi}
          opts={{ loop: false, align: "start" }}
          className="relative overflow-hidden"
        >
          <div className="pointer-events-none absolute left-0 z-20 h-full w-12 bg-gradient-to-r from-surface to-transparent lg:w-20" />
          <div className="pointer-events-none absolute right-0 z-20 h-full w-12 bg-gradient-to-l from-surface to-transparent lg:w-20" />

          <CarouselContent className="ml-0">
            {milestones.map((m, i) => (
              <CarouselItem key={i} className="basis-full pl-0 sm:basis-1/2 md:basis-1/3">
                <div className="flex w-full flex-col items-center">
                  <div className="img-zoom aspect-[3/4] w-4/5 overflow-hidden">
                    <ContentImage image={m.afbeelding} fallbackAlt={m.titel} className="size-full object-cover" />
                  </div>

                  <div className="mt-8 flex w-full items-center">
                    <div className="h-px w-full bg-accent/30" />
                    <div className="z-20 size-3 shrink-0 rounded-full bg-accent shadow-[0_0_0_6px_rgba(180,100,60,0.15)]" />
                    <div className="h-px w-full bg-accent/30" />
                  </div>

                  <div className="mt-6 px-4 text-center">
                    <h3 className="font-heading mb-2 text-2xl font-bold italic text-accent">
                      {m.titel}
                    </h3>
                    <p className="text-sm text-primary/70 md:text-base">{m.tekst}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-10 flex items-center justify-center gap-3">
            <CarouselPrevious className={`static size-10 -translate-y-0 border-primary/20 hover:border-accent hover:text-accent ${carousel.currentIndex === 1 ? "opacity-40 pointer-events-none" : ""}`} />
            <CarouselNext className="static size-10 -translate-y-0 border-primary/20 hover:border-accent hover:text-accent" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
