"use client";

import React from "react";
import { BiCheck } from "react-icons/bi";
import { Link } from "react-router-dom";

const rooms = [
  {
    name: "Standaard kamer",
    price: "€95",
    image: "/images/room-standard.jpg",
    alt: "Standaard kamer De Kopstoof",
    features: [
      "Ontbijt op aanvraag",
      "Parkeerplaats op terrein",
      "Wi-Fi en werkplek",
      "Privé badkamer",
    ],
    featured: false,
  },
  {
    name: "Tuin kamer",
    price: "€125",
    image: "/images/room-garden.jpg",
    alt: "Tuin kamer met uitzicht",
    features: [
      "Uitzicht op het polderlandschap",
      "Originele houten balken",
      "Ontbijt op aanvraag",
      "Parkeerplaats op terrein",
    ],
    featured: true,
  },
  {
    name: "Deluxe suite",
    price: "€155",
    image: "/images/room-deluxe.jpg",
    alt: "Deluxe suite De Kopstoof",
    features: [
      "Aparte luxe zithoek",
      "Luxe ensuite badkamer",
      "Ontbijt op aanvraag",
      "Parkeerplaats op terrein",
      "Wi-Fi en werkplek",
    ],
    featured: false,
  },
];

export function Pricing18() {
  return (
    <section className="px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-lg text-center md:mb-20">
          <p className="overline-text mb-4 text-accent">Tarief</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Eerlijke prijzen
          </h2>
          <p className="mt-5 text-primary/70 md:text-lg">
            Boek rechtstreeks en betaal het beste tarief zonder tussenpersonen.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 lg:grid-cols-3">
          {rooms.map((room) => (
            <div
              key={room.name}
              className={`flex flex-col overflow-hidden ${
                room.featured ? "bg-primary" : "bg-background"
              }`}
            >
              {/* Room image */}
              <div className="img-zoom">
                <img
                  src={room.image}
                  alt={room.alt}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-8">
                {room.featured && (
                  <span className="overline-text mb-4 text-accent">
                    Meest populair
                  </span>
                )}
                <h3
                  className={`font-heading text-2xl font-bold ${
                    room.featured ? "text-cream" : "text-primary"
                  }`}
                >
                  {room.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className={`font-heading text-5xl font-bold ${
                      room.featured ? "text-cream" : "text-primary"
                    }`}
                  >
                    {room.price}
                  </span>
                  <span
                    className={`font-body text-sm ${
                      room.featured ? "text-surface/60" : "text-primary/50"
                    }`}
                  >
                    / nacht
                  </span>
                </div>

                {/* Divider */}
                <div
                  className={`my-6 h-px w-full ${
                    room.featured ? "bg-surface/15" : "bg-primary/10"
                  }`}
                />

                {/* Features */}
                <ul className="flex-1 space-y-3">
                  {room.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <BiCheck
                        className={`mt-0.5 size-5 shrink-0 ${
                          room.featured ? "text-accent" : "text-accent"
                        }`}
                      />
                      <span
                        className={`font-body text-sm ${
                          room.featured ? "text-surface/80" : "text-primary/70"
                        }`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/kamers"
                  className={`mt-8 block py-4 text-center font-body text-sm font-semibold uppercase tracking-widest transition-colors ${
                    room.featured
                      ? "bg-accent text-cream hover:bg-accent-light"
                      : "border border-primary/30 text-primary hover:border-accent hover:text-accent"
                  }`}
                >
                  Boeken
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
