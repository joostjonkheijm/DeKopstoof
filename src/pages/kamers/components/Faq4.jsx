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
            Alles wat je wilt weten over je verblijf bij De Kopstoof
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
              Hoe laat kan ik inchecken?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Inchecken is mogelijk vanaf 15:00 uur. Wil je eerder arriveren,
              stuur ons een bericht via WhatsApp en we zien wat we kunnen doen.
              Uitchecken gebeurt om 11:00 uur.
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
              Zijn huisdieren welkom?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              We houden van dieren, maar onze kamers zijn niet geschikt voor
              huisdieren. Graag nemen we contact met je op om alternatieven te
              bespreken als je een viervoeter meebrengt.
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
              Kan ik een extra bed toevoegen?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Ja, we hebben extra bedden beschikbaar. Laat het ons weten bij het
              boeken of stuur een bericht via WhatsApp. De prijs bedraagt €25
              per nacht.
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
              Is de kamer toegankelijk voor rolstoelen?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Onze standaard kamers hebben enkele treden. Neem contact met ons
              op om te bespreken welke kamer het beste voor je werkt.
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
              Wat als ik moet annuleren?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Annulering tot 7 dagen voor aankomst is gratis. Daarna berekenen
              we één nacht. We begrijpen dat plannen veranderen, dus neem gerust
              contact op.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mx-auto mt-12 max-w-md text-center md:mt-18 lg:mt-20">
          <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
            Nog vragen?
          </h4>
          <p className="md:text-md">
            Stuur ons een bericht via WhatsApp of e-mail
          </p>
          <div className="mt-6 md:mt-8">
            <Button title="WhatsApp" variant="secondary">
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
