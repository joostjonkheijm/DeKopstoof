"use client";

import React from "react";
import { BiEnvelope, BiMap, BiPhone } from "react-icons/bi";
import { RxChevronRight } from "react-icons/rx";

export function Contact14() {
  return (
    <section className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mb-12 max-w-lg md:mb-18 lg:mb-20">
          <p className="mb-3 font-semibold md:mb-4">Bereik</p>
          <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Neem contact op
          </h2>
          <p className="md:text-md">We antwoorden snel en helpen graag.</p>
        </div>
        <div className="grid auto-cols-fr grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-[0.5fr_1fr] md:gap-x-20 md:gap-y-16">
          <div className="grid auto-cols-fr grid-cols-1 gap-x-4 gap-y-10">
            <div>
              <div className="mb-3 md:mb-4">
                <BiEnvelope className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                E-mail
              </h3>
              <p className="mb-2">Stuur ons een bericht</p>
              <a className="underline" href="mailto:info@bnbdekopstoof.nl">
                info@bnbdekopstoof.nl
              </a>
            </div>
            <div>
              <div className="mb-3 md:mb-4">
                <BiPhone className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Telefoon
              </h3>
              <p className="mb-2">Bel of app ons direct</p>
              <a className="underline" href="tel:+31654235765">
                +31 (0)6 54 23 57 65
              </a>
            </div>
            <div>
              <div className="mb-3 md:mb-4">
                <BiMap className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Adres
              </h3>
              <p className="mb-2">Tiendweg Oost 1D, 2941 BV Lekkerkerk</p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Tiendweg+Oost+1D,+2941+BV+Lekkerkerk"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center gap-1 font-body text-sm font-semibold text-accent md:mt-6"
              >
                Route plannen <RxChevronRight />
              </a>
            </div>
          </div>
          <div className="justify-self-end md:w-[321.6px] lg:w-auto">
            <iframe
              src="https://maps.google.com/maps?q=Tiendweg+Oost+1D+2941+BV+Lekkerkerk&output=embed&hl=nl"
              title="Locatie De Kopstoof"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full h-[400px] border-0 md:h-[516px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
