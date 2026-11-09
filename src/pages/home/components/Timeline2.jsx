"use client";

import { Button } from "@relume_io/relume-ui";
import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { RxChevronRight } from "react-icons/rx";
import home from "../../../content/home.json";
import { list, section } from "../../../lib/content";

const Circle = () => {
  const circleRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: circleRef,
    offset: ["end end", "end center"],
  });
  const backgroundColor = {
    backgroundColor: useTransform(scrollYProgress, [0.85, 1], ["#ccc", "#000"]),
  };
  return (
    <div className="absolute flex h-full w-8 items-start justify-center md:-ml-24 md:w-24 lg:-ml-32 lg:w-32">
      <motion.div
        ref={circleRef}
        style={backgroundColor}
        className="z-20 mt-7 size-4 rounded-full shadow-[0_0_0_8px_#fff] md:mt-8"
      />
    </div>
  );
};

export function Timeline2() {
  const c = section(home.verhaal);
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="relative grid auto-cols-fr grid-cols-1 items-start justify-center gap-6 sm:gap-12 md:grid-cols-2 md:gap-24 lg:gap-32">
          <div className="relative top-0 z-10 md:sticky md:top-20 md:z-auto md:pr-4">
            <p className="mb-3 font-semibold md:mb-4">{c.overline}</p>
            <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
              {c.titel}
            </h1>
            <p className="md:text-md">{c.intro}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <Button title={c.knop} variant="secondary">
                {c.knop}
              </Button>
              <Button
                title={c.link_tekst}
                variant="link"
                size="link"
                iconRight={<RxChevronRight />}
              >
                {c.link_tekst}
              </Button>
            </div>
          </div>
          <div className="absolute z-0 flex h-full w-8 flex-col items-center justify-self-start [grid-area:2/1/3/2] md:z-auto md:justify-self-center md:[grid-area:auto]">
            <div className="from-background-primary absolute z-10 h-16 w-1 bg-gradient-to-b to-transparent" />
            <div className="bg-neutral-black sticky top-0 mt-[-50vh] h-[50vh] w-[3px]" />
            <div className="bg-neutral-lighter h-full w-[3px]" />
            <div className="to-background-primary absolute bottom-0 z-0 h-16 w-1 bg-gradient-to-b from-transparent" />
            <div className="bg-background-primary absolute top-[-50vh] h-[50vh] w-full" />
          </div>
          <div className="grid auto-cols-fr gap-x-12 gap-y-8 sm:gap-y-12 md:gap-x-20 md:gap-y-20">
            {list(c.items).map((item, i) => (
              <div key={i} className="relative">
                <Circle />
                <div className="border-border-primary ml-12 flex flex-col border p-6 md:ml-0 md:p-8">
                  <h2 className="mb-3 text-4xl font-bold leading-[1.2] md:mb-4 md:text-5xl lg:text-6xl">
                    {item.jaar}
                  </h2>
                  <h3 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">
                    {item.titel}
                  </h3>
                  <p>{item.tekst}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
                    <Button title={item.knop} variant="secondary">
                      {item.knop}
                    </Button>
                    <Button
                      title={c.link_tekst}
                      variant="link"
                      size="link"
                      iconRight={<RxChevronRight />}
                    >
                      {c.link_tekst}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
