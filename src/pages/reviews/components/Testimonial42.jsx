"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@relume_io/relume-ui";
import React, { useEffect, useState } from "react";
import { BiSolidStar } from "react-icons/bi";
import page from "../../../content/reviews.json";
import { list, section } from "../../../lib/content";

const useCarouselState = () => {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  const handleDotClick = (index) => () => api?.scrollTo(index);
  const dotClassName = (index) =>
    `mx-[3px] inline-block h-px transition-all duration-300 ${
      current === index + 1 ? "w-8 bg-accent" : "w-4 bg-primary/30"
    }`;

  return { api, setApi, current, handleDotClick, dotClassName };
};

export function Testimonial42() {
  const carousel = useCarouselState();
  const c = section(page.reviews);
  const reviews = list(c.items);
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="grid grid-cols-1 items-start gap-12 md:gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="lg:sticky lg:top-24">
            <p className="overline-text mb-4 text-accent">{c.overline}</p>
            <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
              {c.titel}
            </h2>
            <p className="mt-5 max-w-md text-primary/70 md:text-lg">{c.intro}</p>
            <div className="mt-8 flex gap-2">
              {[1,2,3,4,5].map(s => (
                <BiSolidStar key={s} className="size-5 fill-accent text-accent" />
              ))}
              <span className="ml-2 font-body text-sm text-primary/60">{c.gemiddelde}</span>
            </div>
          </div>

          <Carousel
            setApi={carousel.setApi}
            opts={{ loop: true, align: "start" }}
          >
            <CarouselContent>
              {reviews.map((r, i) => (
                <CarouselItem key={i} className="basis-full">
                  <div className="flex flex-col justify-between bg-background p-8 md:p-10">
                    <div className="mb-5 flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <BiSolidStar key={s} className="size-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <span className="mb-2 font-heading text-5xl leading-none text-accent/20">"</span>
                    <blockquote className="font-heading text-xl font-bold italic leading-relaxed">
                      {r.citaat}
                    </blockquote>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="h-8 w-px bg-accent/30" />
                      <div>
                        <p className="font-body font-semibold text-primary">{r.naam}</p>
                        <p className="font-body text-sm text-primary/60">{r.herkomst}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={carousel.handleDotClick(i)}
                    className={carousel.dotClassName(i)}
                    aria-label={`Review ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <CarouselPrevious className="static size-10 -translate-y-0 border-primary/20 hover:border-accent hover:text-accent" />
                <CarouselNext className="static size-10 -translate-y-0 border-primary/20 hover:border-accent hover:text-accent" />
              </div>
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
