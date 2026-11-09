"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BiLogoFacebookCircle,
  BiLogoInstagram,
} from "react-icons/bi";
import { links, section, site } from "../lib/content";

export function Footer2() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setEmail("");
  };

  const c = section(site.footer);
  const contact = section(site.contact);
  const newsletter = section(c.nieuwsbrief);

  return (
    <footer className="bg-primary px-[5%] pt-16 md:pt-20 lg:pt-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-12 pb-12 md:gap-16 md:pb-16 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:pb-20">
          {/* Brand column */}
          <div>
            <Link to="/">
              <span className="font-heading text-2xl font-bold italic text-cream">
                {site.naam}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-surface/70">
              {c.beschrijving}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={c.facebook_url || "#"}
                className="text-surface/50 transition-colors hover:text-accent"
                aria-label="Facebook"
              >
                <BiLogoFacebookCircle className="size-5" />
              </a>
              <a
                href={c.instagram_url || "#"}
                className="text-surface/50 transition-colors hover:text-accent"
                aria-label="Instagram"
              >
                <BiLogoInstagram className="size-5" />
              </a>
            </div>
            <address className="mt-6 not-italic">
              <p className="text-sm text-surface/70">{contact.adres_straat}</p>
              <p className="text-sm text-surface/70">{contact.adres_postcode_plaats}</p>
              <a
                href={links.phone}
                className="mt-1 block text-sm text-surface/70 transition-colors hover:text-accent"
              >
                {contact.telefoon_weergave}
              </a>
              <a
                href={links.email}
                className="mt-1 block text-sm text-surface/70 transition-colors hover:text-accent"
              >
                {contact.email}
              </a>
            </address>
          </div>

          {/* Nav columns */}
          <div>
            <h3 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-surface/50">
              {c.kolom_verkennen_titel}
            </h3>
            <ul className="space-y-2">
              {[
                { to: "/", label: "Home" },
                { to: "/kamers", label: "De Kamer" },
                { to: "/omgeving", label: "Omgeving" },
                { to: "/over-de-kopstoof", label: "Over ons" },
                { to: "/reviews", label: "Reviews" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="font-body text-sm text-surface/70 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-surface/50">
              {c.kolom_contact_titel}
            </h3>
            <ul className="space-y-2">
              {[
                { href: links.whatsapp, label: "WhatsApp" },
                { href: "#", label: "Reserveren" },
                { href: "#", label: "Cadeaubon" },
                { href: "#", label: "Annuleringsbeleid" },
                { href: "#", label: "Privacybeleid" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="font-body text-sm text-surface/70 transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter column */}
          <div>
            <h3 className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-surface/50">
              {newsletter.titel}
            </h3>
            <p className="mb-5 text-sm text-surface/70">
              {newsletter.tekst}
            </p>
            {sent ? (
              <p className="text-sm text-accent">
                {newsletter.bedankt}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={newsletter.placeholder}
                  required
                  className="border border-surface/20 bg-primary-light px-4 py-3 font-body text-sm text-cream placeholder-surface/40 focus:border-accent focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-accent px-4 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-accent-light"
                >
                  {newsletter.knop}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-start gap-4 border-t border-surface/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs text-surface/40">
            © {new Date().getFullYear()} {site.naam}. {c.copyright}
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="font-body text-xs text-surface/40 transition-colors hover:text-surface/70"
            >
              Privacybeleid
            </a>
            <a
              href="#"
              className="font-body text-xs text-surface/40 transition-colors hover:text-surface/70"
            >
              Algemene voorwaarden
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
