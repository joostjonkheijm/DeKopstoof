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
            Wat u moet weten over Lekkerkerk en de omgeving
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
              Hoe bereik ik Lekkerkerk?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Lekkerkerk ligt tussen Rotterdam en Utrecht, gemakkelijk
              bereikbaar per auto of trein. Vanaf Amsterdam-Centraal bent u in
              een uur hier. Parkeren is gratis en ruim beschikbaar.
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
              Wat zijn de beste fietsroutes?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              De polder rondom Lekkerkerk is gemaakt voor fietsen. Vlak terrein,
              rustige wegen, en overal water en groen. Veel routes voeren langs
              molens en dorpjes waar u kunt stoppen voor koffie.
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
              Waar eet ik goed in de buurt?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Het dorp heeft restaurants met lokale ingrediënten, cafés aan het
              water, en boerderijwinkels waar u rechtstreeks van de teler koopt.
              Geen kettingzaken, alleen echte plekken.
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
              Wat is er in het najaar te doen?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Herfstlicht maakt de polder goud. Vogelkijken wordt interessant,
              de markten vol met oogst, en de wegen zijn stil. Ideaal voor wie
              rust zoekt zonder saaiheid.
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
              Zijn er molens te bezoeken?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Ja. Enkele molens in de buurt zijn nog werkend en open voor
              bezoekers. Ze staan in het landschap zoals ze horen, niet in een
              museum. Fietsen ernaartoe hoort erbij.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mx-auto mt-12 max-w-md text-center md:mt-18 lg:mt-20">
          <h4 className="mb-3 text-2xl font-bold md:mb-4 md:text-3xl md:leading-[1.3] lg:text-4xl">
            Nog iets weten?
          </h4>
          <p className="md:text-md">Stel uw vraag rechtstreeks</p>
          <div className="mt-6 md:mt-8">
            <Button title="Mailen" variant="secondary">
              Mailen
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
