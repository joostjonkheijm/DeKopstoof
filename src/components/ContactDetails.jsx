import React from "react";
import { BiEnvelope, BiMap, BiPhone } from "react-icons/bi";
import { RxChevronRight } from "react-icons/rx";
import { links, section, site } from "../lib/content";

/**
 * E-mail / phone / address columns plus the map. All values come from
 * site.json, so the three contact sections on the site cannot drift apart.
 */
export function ContactDetails() {
  const contact = section(site.contact);
  const labels = section(site.contactblok);
  const address = [contact.adres_straat, contact.adres_postcode_plaats]
    .filter(Boolean)
    .join(", ");
  const mapQuery = encodeURIComponent(address).replace(/%20/g, "+").replace(/%2C/g, ",");

  return (
    <div className="grid auto-cols-fr grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-[0.5fr_1fr] md:gap-x-20 md:gap-y-16">
      <div className="grid auto-cols-fr grid-cols-1 gap-x-4 gap-y-10">
        <div>
          <div className="mb-3 md:mb-4">
            <BiEnvelope className="size-8" />
          </div>
          <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
            {labels.email_titel}
          </h3>
          <p className="mb-2">{labels.email_tekst}</p>
          <a className="underline" href={links.email}>
            {contact.email}
          </a>
        </div>
        <div>
          <div className="mb-3 md:mb-4">
            <BiPhone className="size-8" />
          </div>
          <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
            {labels.telefoon_titel}
          </h3>
          <p className="mb-2">{labels.telefoon_tekst}</p>
          <a className="underline" href={links.phone}>
            {contact.telefoon_weergave}
          </a>
        </div>
        <div>
          <div className="mb-3 md:mb-4">
            <BiMap className="size-8" />
          </div>
          <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
            {labels.adres_titel}
          </h3>
          <p className="mb-2">{address}</p>
          {address && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center gap-1 font-body text-sm font-semibold text-accent md:mt-6"
            >
              {labels.route_knop} <RxChevronRight />
            </a>
          )}
        </div>
      </div>
      <div className="justify-self-end md:w-[321.6px] lg:w-auto">
        {address && (
          <iframe
            src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&hl=nl`}
            title={`Locatie ${site.naam ?? ""}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full h-[400px] border-0 md:h-[516px]"
          />
        )}
      </div>
    </div>
  );
}
