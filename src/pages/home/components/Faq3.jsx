"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from "@relume_io/relume-ui";
import React from "react";

export function Faq3() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-12 lg:grid-cols-[.75fr,1fr] lg:gap-x-20">
        <div>
          <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Vragen
          </h2>
          <p className="md:text-md">
            Alles wat je moet weten voordat je boekt. Geen verborgen details,
            geen verrassingen.
          </p>
          <div className="mt-6 md:mt-8">
            <Button title="Contact" variant="secondary">
              Contact
            </Button>
          </div>
        </div>
        <Accordion type="multiple">
          <AccordionItem value="item-0">
            <AccordionTrigger className="md:py-5 md:text-md">
              Wat zijn de inchecktijden?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Inchecken kan vanaf 15:00 uur. Vroeger aankomen? Laat het ons
              weten en we doen ons best. Uitchecken is om 11:00 uur, maar ook
              hier zijn we flexibel.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-1">
            <AccordionTrigger className="md:py-5 md:text-md">
              Kunnen we huisdieren meenemen?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Huisdieren zijn welkom, maar we vragen je dit van tevoren door te
              geven. We hebben enkele voorzorgsmaatregelen om alles schoon en
              comfortabel te houden.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="md:py-5 md:text-md">
              Wat als ik moet annuleren?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Annulering tot zeven dagen voor aankomst is gratis. Daarna rekenen
              we het volledige bedrag. We begrijpen dat dingen veranderen en
              proberen altijd redelijk te zijn.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="md:py-5 md:text-md">
              Is ontbijt echt inbegrepen?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              Ja, volledig. Vers brood, lokale kaas, eieren, fruit en
              zelfgemaakte jam. Alles wat je nodig hebt voor een goed begin van
              de dag.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="md:py-5 md:text-md">
              Hoe betaal ik veilig?
            </AccordionTrigger>
            <AccordionContent className="md:pb-6">
              We accepteren alle grote creditcards en iDEAL. Je betaalt pas als
              je boeking bevestigd is. Geen verborgen kosten, geen verrassingen
              bij checkout.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
