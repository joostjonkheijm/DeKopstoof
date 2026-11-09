import React, { useState } from "react";
import { Navbar6 } from "../../components/Navbar6";
import { Footer2 } from "../../components/Footer2";
import { BookingCalendar } from "./components/BookingCalendar";
import { InquiryForm } from "./components/InquiryForm";
import page from "../../content/boeken.json";
import { links, section, site } from "../../lib/content";

export default function Boeken() {
  const [selectedRange, setSelectedRange] = useState(null);
  const header = section(page.header);
  const calendar = section(page.kalender);
  const form = section(page.formulier);
  const contactLine = section(page.contact_regel);

  return (
    <>
      <Navbar6 />

      {/* Page header */}
      <section className="bg-surface px-[5%] py-20 md:py-28">
        <div className="container">
          <p className="overline-text mb-4 text-accent">{header.overline}</p>
          <h1 className="font-heading text-5xl font-bold md:text-7xl lg:text-8xl">
            {header.titel}
          </h1>
          <p className="mt-5 max-w-lg text-primary/70 md:text-lg">{header.intro}</p>
        </div>
      </section>

      {/* Calendar + form */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_420px] lg:gap-20">
            {/* Left: calendar */}
            <div>
              <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                {calendar.titel}
              </h2>
              <BookingCalendar onRangeSelect={setSelectedRange} />
            </div>

            {/* Right: form — shown after date selection */}
            <div>
              {selectedRange ? (
                <>
                  <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                    {form.titel}
                  </h2>
                  <InquiryForm
                    key={`${selectedRange.checkIn}-${selectedRange.checkOut}`}
                    checkIn={selectedRange.checkIn}
                    checkOut={selectedRange.checkOut}
                  />
                </>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center border border-dashed border-primary/20 p-10 lg:mt-16">
                  <p className="text-center font-body text-sm text-primary/50">
                    {calendar.lege_staat}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact fallback */}
      <section className="bg-surface px-[5%] py-12 md:py-16">
        <div className="container text-center">
          <p className="font-body text-sm text-primary/60">
            {contactLine.tekst}{" "}
            <a href={links.email} className="underline hover:text-accent">
              {contactLine.mail_link}
            </a>{" "}
            of{" "}
            <a href={links.phone} className="underline hover:text-accent">
              {contactLine.bel_link} {section(site.contact).telefoon_weergave}
            </a>
            .
          </p>
        </div>
      </section>

      <Footer2 />
    </>
  );
}
