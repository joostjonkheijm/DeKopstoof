import React, { useState } from "react";
import { Navbar6 } from "../../components/Navbar6";
import { Footer2 } from "../home/components/Footer2";
import { BookingCalendar } from "./components/BookingCalendar";
import { InquiryForm } from "./components/InquiryForm";

export default function Boeken() {
  const [selectedRange, setSelectedRange] = useState(null);

  return (
    <>
      <Navbar6 />

      {/* Page header */}
      <section className="bg-surface px-[5%] py-20 md:py-28">
        <div className="container">
          <p className="overline-text mb-4 text-accent">Direct boeken</p>
          <h1 className="font-heading text-5xl font-bold md:text-7xl lg:text-8xl">
            Reserveer jouw verblijf
          </h1>
          <p className="mt-5 max-w-lg text-primary/70 md:text-lg">
            Kies jouw check-in en check-out datum. Grijze datums zijn al bezet.
            Na jouw aanvraag nemen we binnen 24 uur contact op.
          </p>
        </div>
      </section>

      {/* Calendar + form */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_420px] lg:gap-20">
            {/* Left: calendar */}
            <div>
              <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                Kies jouw data
              </h2>
              <BookingCalendar onRangeSelect={setSelectedRange} />
            </div>

            {/* Right: form — shown after date selection */}
            <div>
              {selectedRange ? (
                <>
                  <h2 className="mb-8 font-heading text-2xl font-bold text-primary md:text-3xl">
                    Jouw gegevens
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
                    Selecteer eerst een check-in en check-out datum in de kalender.
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
            Liever direct contact?{" "}
            <a href="mailto:info@bnbdekopstoof.nl" className="underline hover:text-accent">
              Mail ons
            </a>{" "}
            of{" "}
            <a href="tel:+31654235765" className="underline hover:text-accent">
              bel +31 6 54 23 57 65
            </a>
            .
          </p>
        </div>
      </section>

      <Footer2 />
    </>
  );
}
