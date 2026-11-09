"use client";

import { useMediaQuery } from "@relume_io/relume-ui";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import React, { Fragment, useRef } from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";
import home from "../../../content/home.json";
import { ContentImage } from "../../../components/ContentImage";
import { list, section, stepNumber } from "../../../lib/content";

const content = section(home.stappen);
// Static at build time, so the per-step hooks below keep a stable call count.
const steps = list(content.items).map((item, i) => ({
  number: stepNumber(i),
  heading: item?.titel,
  description: item?.tekst,
  image: item?.afbeelding,
}));

const useScrollAnim = ({ data }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const getStyles = (index) => {
    const start = index / data.length;
    const end = (index + 1) / data.length;
    const opacity = useTransform(
      scrollYProgress,
      [Math.max(0, start - 0.07), start, end - 0.07, Math.min(1, end)],
      [0, 1, 1, 0]
    );
    const y = useTransform(
      scrollYProgress,
      [Math.max(0, start - 0.1), start, end - 0.1, Math.min(1, end)],
      [80, 0, 0, -80]
    );
    return { opacity, y };
  };

  return { containerRef, getStyles };
};

export function Layout513() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const scroll = useScrollAnim({ data: steps });

  return (
    <section
      ref={scroll.containerRef}
      className="px-[5%] py-20 md:py-28 lg:py-32"
    >
      <div className="container">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-20">
          {/* Left sticky column */}
          <div className="flex flex-col gap-y-16 md:sticky md:top-24 md:mt-20 md:h-[calc(100vh_-_10rem)] md:justify-center">
            <div>
              <p className="overline-text mb-4 text-accent">{content.overline}</p>
              <h2 className="font-heading text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                {content.titel}
              </h2>
              <p className="mt-5 text-primary/70">{content.intro}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/kamers"
                  className="border border-primary/30 px-6 py-3 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
                >
                  {content.knop}
                </Link>
                <Link
                  to="/kamers"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-accent"
                >
                  {content.link_tekst} <RxChevronRight />
                </Link>
              </div>
            </div>

            {/* Animated step text — tablet+ */}
            <div className="relative hidden min-h-[8rem] flex-col gap-y-8 md:flex">
              <AnimatePresence>
                {steps.map((step, i) => (
                  <Fragment key={i}>
                    {isTablet && (
                      <motion.div
                        style={scroll.getStyles(i)}
                        className="md:absolute first:md:relative"
                      >
                        <span className="font-heading text-4xl font-bold italic text-accent/20">
                          {step.number}
                        </span>
                        <h3 className="mt-2 font-heading text-2xl font-bold">
                          {step.heading}
                        </h3>
                        <p className="mt-2 text-primary/70">{step.description}</p>
                      </motion.div>
                    )}
                  </Fragment>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: scrolling images — tablet+ */}
          <div className="hidden md:grid md:grid-cols-1 md:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="img-zoom overflow-hidden">
                <ContentImage
                  image={step.image}
                  fallbackAlt={step.heading}
                  className="h-screen w-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Mobile: stacked steps */}
          {isMobile && (
            <div className="flex flex-col gap-8 md:hidden">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <span className="font-heading text-3xl font-bold italic text-accent/20">
                    {step.number}
                  </span>
                  <h3 className="font-heading text-xl font-bold">{step.heading}</h3>
                  <p className="text-sm text-primary/70">{step.description}</p>
                  <div className="img-zoom overflow-hidden">
                    <ContentImage
                      image={step.image}
                      fallbackAlt={step.heading}
                      className="aspect-video w-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
