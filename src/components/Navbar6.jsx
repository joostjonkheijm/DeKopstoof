"use client";

import { useMediaQuery } from "@relume_io/relume-ui";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { RxChevronDown } from "react-icons/rx";
import { Link } from "react-router-dom";

const useNavState = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 991px)");

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const openDropdown = () => !isMobile && setIsDropdownOpen(true);
  const closeDropdown = () => !isMobile && setIsDropdownOpen(false);
  const toggleMobileDropdown = () => setIsDropdownOpen((prev) => !prev);

  return {
    isMobileMenuOpen,
    isDropdownOpen,
    toggleMobileMenu,
    openDropdown,
    closeDropdown,
    toggleMobileDropdown,
  };
};

const NavLink = ({ to, children, className = "" }) => (
  <Link
    to={to}
    className={`relative py-2 font-body text-sm font-medium text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:text-accent hover:after:w-full lg:px-4 lg:py-6 ${className}`}
  >
    {children}
  </Link>
);

export function Navbar6() {
  const nav = useNavState();

  return (
    <header className="relative z-[999] flex min-h-16 w-full items-center border-b border-primary/10 bg-background/95 px-[5%] backdrop-blur-sm md:min-h-18">
      <div className="mx-auto flex size-full max-w-full items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="font-heading text-xl font-bold italic text-primary">
            De Kopstoof
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center lg:flex lg:flex-1 lg:justify-center">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/kamers">Kamers</NavLink>
          <NavLink to="/omgeving">Omgeving</NavLink>

          {/* Dropdown */}
          <div
            className="relative"
            onMouseEnter={nav.openDropdown}
            onMouseLeave={nav.closeDropdown}
          >
            <button
              className="flex items-center gap-1 px-4 py-6 font-body text-sm font-medium text-primary transition-colors hover:text-accent"
              onClick={nav.toggleMobileDropdown}
            >
              Meer
              <motion.span
                animate={{ rotate: nav.isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <RxChevronDown className="size-4" />
              </motion.span>
            </button>

            <AnimatePresence>
              {nav.isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 top-full w-56 border border-primary/10 bg-background shadow-warm"
                >
                  <div className="p-2">
                    {[
                      { to: "/over-de-kopstoof", label: "Over De Kopstoof" },
                      { to: "/reviews", label: "Reviews" },
                      { to: "/kamers", label: "Galerij" },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block px-4 py-2.5 font-body text-sm text-primary transition-colors hover:bg-surface hover:text-accent"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/kamers"
            className="border border-primary/30 px-5 py-2.5 font-body text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
          >
            Bekijk kamers
          </Link>
          <Link
            to="/kamers"
            className="bg-accent px-5 py-2.5 font-body text-sm font-semibold text-cream transition-colors hover:bg-accent-light"
          >
            Boek nu
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="-mr-2 flex size-12 cursor-pointer flex-col items-center justify-center lg:hidden"
          onClick={nav.toggleMobileMenu}
          aria-label="Menu"
        >
          <motion.span
            className="my-[3px] h-0.5 w-6 bg-primary"
            animate={
              nav.isMobileMenuOpen
                ? { translateY: 8, rotate: -45 }
                : { translateY: 0, rotate: 0 }
            }
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="my-[3px] h-0.5 bg-primary"
            animate={
              nav.isMobileMenuOpen
                ? { width: 0, opacity: 0 }
                : { width: "1.5rem", opacity: 1 }
            }
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="my-[3px] h-0.5 w-6 bg-primary"
            animate={
              nav.isMobileMenuOpen
                ? { translateY: -8, rotate: 45 }
                : { translateY: 0, rotate: 0 }
            }
            transition={{ duration: 0.3 }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {nav.isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 right-0 top-full overflow-hidden border-b border-primary/10 bg-background shadow-warm lg:hidden"
          >
            <div className="flex flex-col px-[5%] py-6">
              {[
                { to: "/", label: "Home" },
                { to: "/kamers", label: "Kamers" },
                { to: "/omgeving", label: "Omgeving" },
                { to: "/over-de-kopstoof", label: "Over De Kopstoof" },
                { to: "/reviews", label: "Reviews" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="border-b border-primary/10 py-4 font-body text-base font-medium text-primary last:border-0"
                  onClick={nav.toggleMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/kamers"
                  className="border border-primary/30 px-6 py-3 text-center font-body text-sm font-semibold text-primary"
                  onClick={nav.toggleMobileMenu}
                >
                  Bekijk kamers
                </Link>
                <Link
                  to="/kamers"
                  className="bg-accent px-6 py-3 text-center font-body text-sm font-semibold text-cream"
                  onClick={nav.toggleMobileMenu}
                >
                  Boek nu
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
