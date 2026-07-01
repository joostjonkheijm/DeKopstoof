"use client";

import React from "react";
import { Link } from "react-router-dom";

const team = [
  {
    name: "Marieke en Jorn",
    role: "Eigenaren en gastheren",
    bio: "Ze zagen iets in deze oude boerderij en besloten het waar te maken. Hun passie is voelbaar.",
    image: "/images/about-story.jpg",
  },
  {
    name: "Els",
    role: "Ontbijt en huishouding",
    bio: "Zij zorgt dat elke ochtend voelt als thuiskomen. Lokale ingrediënten, warme handen, geen haast.",
    image: "/images/gallery-breakfast.jpg",
  },
  {
    name: "Pieter",
    role: "Onderhoud en tuin",
    bio: "Hij kent elk hoekje van dit huis en weet wat nodig is voordat je het vraagt.",
    image: "/images/gallery-garden.jpg",
  },
];

export function Team18() {
  return (
    <section className="bg-surface px-[5%] py-20 md:py-28 lg:py-32">
      <div className="container">
        <div className="mb-16 md:mb-20">
          <p className="overline-text mb-4 text-accent">Gezichten</p>
          <h2 className="font-heading text-5xl font-bold md:text-6xl lg:text-7xl">
            Het team achter de deur
          </h2>
          <p className="mt-5 max-w-md text-primary/70 md:text-lg">
            De mensen die je welkom heten.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-primary/10 sm:grid-cols-3">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col overflow-hidden bg-background">
              <div className="img-zoom aspect-square overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-heading text-xl font-bold">{member.name}</h3>
                <p className="mt-1 font-body text-sm font-semibold uppercase tracking-wider text-accent">
                  {member.role}
                </p>
                <p className="mt-3 text-sm text-primary/70">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
