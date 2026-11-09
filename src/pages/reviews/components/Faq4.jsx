"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@relume_io/relume-ui";
import React from "react";
import { RxPlus } from "react-icons/rx";
import page from "../../../content/reviews.json";
import { Markdown } from "../../../components/Markdown";
import { list, section } from "../../../lib/content";

export function Faq4() {
  const c = section(page.faq);
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container max-w-lg">
        <div className="rb-12 mb-12 text-center md:mb-18 lg:mb-20">
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            {c.titel}
          </h2>
          <p className="md:text-md">{c.intro}</p>
        </div>
        <Accordion
          type="multiple"
          className="grid items-start justify-stretch gap-4"
        >
          {list(c.vragen).map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border-primary px-5 md:px-6"
            >
              <AccordionTrigger
                icon={
                  <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
                }
                className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
              >
                {item.vraag}
              </AccordionTrigger>
              <AccordionContent className="md:pb-6">
                <Markdown className="mb-3 last:mb-0">{item.antwoord}</Markdown>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mx-auto mt-12 max-w-md text-center md:mt-18 lg:mt-20">
          <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
            {c.slot_titel}
          </h4>
          <p className="md:text-md">{c.slot_tekst}</p>
          <div className="mt-6 md:mt-8">
            <Button title={c.slot_knop} variant="secondary">
              {c.slot_knop}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
