"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@relume_io/relume-ui";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import home from "../../../content/home.json";
import { list, section } from "../../../lib/content";

const content = section(home.galerij);
// Skip entries without a photo so an empty CMS item never renders a broken image.
const galleryImages = list(content.fotos).filter((img) => img?.src);

const useCarousel = () => {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
  }, [api]);

  const handleDotClick = (index) => () => api?.scrollTo(index);

  const dotClassName = (index) =>
    clsx("relative mx-[3px] inline-block h-px transition-all duration-300", {
      "w-8 bg-accent": current === index + 1,
      "w-4 bg-primary/30": current !== index + 1,
    });

  return { api, setApi, handleDotClick, dotClassName };
};

export function Gallery18() {
  const carousel = useCarousel();
  return (
    <section className="bg-primary px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <p className="overline-text mb-4 text-accent">{content.overline}</p>
          <h2 className="font-heading text-5xl font-bold italic text-cream md:text-6xl lg:text-7xl">
            {content.titel}
          </h2>
          <p className="mt-4 text-surface/75 md:text-lg">{content.intro}</p>
        </div>

        {galleryImages.length > 0 && (
        <Carousel
          setApi={carousel.setApi}
          opts={{ loop: true, align: "start" }}
        >
          <div className="relative">
            <CarouselContent className="ml-0">
              {galleryImages.map((img, i) => (
                <CarouselItem
                  key={i}
                  className="basis-4/5 px-2 sm:basis-1/2 md:basis-1/3 md:px-3"
                >
                  <div className="img-zoom aspect-square w-full overflow-hidden">
                    <img
                      src={img.src}
                      alt={img.alt ?? ""}
                      className="size-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden border-surface/30 bg-primary/80 text-surface hover:bg-primary hover:text-accent md:flex md:size-12 lg:size-14" />
            <CarouselNext className="hidden border-surface/30 bg-primary/80 text-surface hover:bg-primary hover:text-accent md:flex md:size-12 lg:size-14" />
          </div>

          {/* Dot indicators */}
          <div className="mt-8 flex items-center justify-center">
            {galleryImages.map((_, i) => (
              <button
                key={i}
                onClick={carousel.handleDotClick(i)}
                className={carousel.dotClassName(i)}
                aria-label={`Ga naar foto ${i + 1}`}
              />
            ))}
          </div>
        </Carousel>
        )}
      </div>
    </section>
  );
}
