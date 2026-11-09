"use client";

import React from "react";
import page from "../../../content/over-de-kopstoof.json";
import { ContactDetails } from "../../../components/ContactDetails";
import { section } from "../../../lib/content";

export function Contact14() {
  const c = section(page.contact);
  return (
    <section className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mb-12 max-w-lg md:mb-18 lg:mb-20">
          <p className="mb-3 font-semibold md:mb-4">{c.overline}</p>
          <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            {c.titel}
          </h2>
          <p className="md:text-md">{c.intro}</p>
        </div>
        <ContactDetails />
      </div>
    </section>
  );
}
