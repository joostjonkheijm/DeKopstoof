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

export function Faq4() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container max-w-lg">
        <div className="rb-12 mb-12 text-center md:mb-18 lg:mb-20">
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Vragen
          </h2>
          <p className="md:text-md">
            Alles wat je wilt weten over onze reviews en ervaringen van gasten.
          </p>
        </div>
        <Accordion
          type="multiple"
          className="grid items-start justify-stretch gap-4"
        >
          <AccordionItem
            value="item-0"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Waar komen reviews vandaan?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Onze reviews komen van echte gasten die hebben overnacht en
              ontbeten bij De Kopstoof. We verzamelen ervaringen van Google,
              Booking.com, TripAdvisor en directe feedback van gasten. Elk
              verhaal is authentiek en niet bewerkt.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-1"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Kan ik zelf een review schrijven?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Ja, graag. Na je verblijf ontvang je een link om je ervaringen te
              delen op Google, Booking.com of TripAdvisor. Je feedback helpt ons
              beter te worden en andere reizigers te helpen.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-2"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Hoe oud zijn deze reviews?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              We tonen reviews van de afgelopen jaren. De meest recente
              ervaringen staan bovenaan. Alle beoordelingen zijn geverifieerd
              door de platforms waarop ze zijn geplaatst.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-3"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Wat als ik een vraag heb?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Stuur ons een bericht via WhatsApp of vul het contactformulier in.
              We antwoorden snel en persoonlijk. Je kunt ook bellen voor een
              direct gesprek.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="item-4"
            className="border border-border-primary px-5 md:px-6"
          >
            <AccordionTrigger
              icon={
                <RxPlus className="size-7 shrink-0 text-text-primary transition-transform duration-300 md:size-8" />
              }
              className="md:py-5 md:text-md [&[data-state=open]>svg]:rotate-45"
            >
              Zijn alle reviews positief?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              We tonen alle reviews eerlijk. Constructieve feedback helpt ons
              groeien. Mocht je iets tegenkomen dat niet klopt, neem contact op
              en we lossen het op.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mx-auto mt-12 max-w-md text-center md:mt-18 lg:mt-20">
          <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
            Nog meer vragen?
          </h4>
          <p className="md:text-md">
            Bereik ons via WhatsApp of het contactformulier hieronder.
          </p>
          <div className="mt-6 md:mt-8">
            <Button title="Stuur bericht" variant="secondary">
              Stuur bericht
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
