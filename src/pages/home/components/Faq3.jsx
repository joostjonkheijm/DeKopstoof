"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@relume_io/relume-ui";
import React from "react";
import home from "../../../content/home.json";
import { Markdown } from "../../../components/Markdown";
import { list, section } from "../../../lib/content";

export function Faq3() {
  const c = section(home.faq);
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-12 lg:grid-cols-[.75fr,1fr] lg:gap-x-20">
        <div>
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            {c.titel}
          </h2>
          <p className="md:text-md">{c.intro}</p>
          <div className="mt-6 md:mt-8">
            <Button title={c.knop} variant="secondary">
              {c.knop}
            </Button>
          </div>
        </div>
        <Accordion type="multiple">
          {list(c.vragen).map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="md:py-5 md:text-md">
                {item.vraag}
              </AccordionTrigger>
              <AccordionContent className="md:pb-6">
                <Markdown className="mb-3 last:mb-0">{item.antwoord}</Markdown>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
