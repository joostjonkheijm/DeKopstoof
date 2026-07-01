"use client";

import React from "react";
import { Link } from "react-router-dom";
import { RxChevronRight } from "react-icons/rx";

export function Layout369() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-lg text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Extra's</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Meer dan je verwacht
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Kleine dingen die je verblijf compleet maken.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Wide card — bikes */}
          <div className="col-span-1 grid overflow-hidden bg-background sm:col-span-2 sm:grid-cols-2">
            <div className="flex flex-col justify-center p-8">
              <p className="overline-text mb-3 text-accent">Fietsen</p>
              <h3 className="font-heading text-2xl font-bold md:text-3xl">
                Fietsverhuur & knooppunten
              </h3>
              <p className="mt-3 text-primary/70">
                We zetten huurfietsen voor u klaar en knooppuntenroutes liggen
                klaar. Elektrische fiets? Die laadt u op in de fietsenschuur.
              </p>
              <Link
                to="/omgeving"
                className="mt-6 flex items-center gap-1 font-body text-sm font-semibold text-accent transition-colors hover:text-accent-light"
              >
                Omgeving verkennen <RxChevronRight />
              </Link>
            </div>
            <div className="img-zoom">
              <img
                src="/images/surroundings-water.jpg"
                alt="Fietsen rondom Lekkerkerk"
                className="size-full min-h-[220px] object-cover"
              />
            </div>
          </div>

          {/* Small card — local tips */}
          <div className="flex flex-col overflow-hidden bg-background">
            <div className="p-6 md:p-8">
              <p className="overline-text mb-2 text-accent">Tips</p>
              <h3 className="font-heading text-xl font-bold md:text-2xl">
                Persoonlijk advies
              </h3>
              <p className="mt-2 text-sm text-primary/70">
                Spreek ons gerust aan voor restaurantjes, kaasboerderijen of
                andere bezienswaardigheden. Of kijk in het folderrekje in de gang.
              </p>
              <Link
                to="/omgeving"
                className="mt-5 flex items-center gap-1 font-body text-sm font-semibold text-accent"
              >
                Omgeving <RxChevronRight />
              </Link>
            </div>
            <div className="img-zoom mt-auto">
              <img
                src="/images/gallery-garden.jpg"
                alt="Lokale omgeving Lekkerkerk"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>

          {/* Small card — sauna */}
          <div className="flex flex-col overflow-hidden bg-background">
            <div className="p-6 md:p-8">
              <p className="overline-text mb-2 text-accent">Bij te boeken</p>
              <h3 className="font-heading text-xl font-bold md:text-2xl">
                Sauna & rustruimte
              </h3>
              <p className="mt-2 text-sm text-primary/70">
                We stoken de saunakachel voor u op en u krijgt een volle mand
                hout om zelf op temperatuur te houden. De koelkast is gevuld.
              </p>
              <Link
                to="/kamers"
                className="mt-5 flex items-center gap-1 font-body text-sm font-semibold text-accent"
              >
                Sauna bijboeken <RxChevronRight />
              </Link>
            </div>
            <div className="img-zoom mt-auto">
              <img
                src="/images/gallery-bathroom.jpg"
                alt="Sauna bij De Kopstoof"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
