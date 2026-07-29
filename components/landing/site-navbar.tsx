"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Show } from "@clerk/nextjs";
import { ChevronRight, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Our Story",    href: "/#our-story"     },
  { label: "How It Works", href: "/#how-it-works"  },
  { label: "Visits",       href: "/visits"         },
  { label: "Gallery",      href: "/gallery"        },
  { label: "Blog",         href: "/blog"           },
];

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(250,250,247,.98)" : "rgba(250,250,247,.92)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid var(--lp-border)",
        boxShadow: scrolled ? "0 2px 28px rgba(25,20,15,.06)" : "none",
        transition: "background .3s, box-shadow .3s",
      }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 0.68, 0, 1.2] }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Link href="/">
            <Image src="/logo_wide.png" alt="Gyan Setu" width={135} height={40} style={{ height: 40, width: "auto", objectFit: "contain" }} />
          </Link>
        </motion.div>

        <div className="desktop-nav-links" style={{ display: "flex", gap: 30 }}>
          {navLinks.map(({ label, href }, i) => (
            <motion.a
              key={label}
              href={href}
              className="nav-link"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.055 }}
            >
              {label}
            </motion.a>
          ))}
        </div>

        <motion.div
          className="desktop-nav-links"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Show
            when="signed-in"
            fallback={
              <>
                <Link href="/sign-in" className="btn-ghost">Sign In</Link>
                <Link href="/sign-up" className="btn-primary">
                  Get Started <ChevronRight size={15} />
                </Link>
              </>
            }
          >
            <Link href="/dashboard" className="btn-primary">
              Go to Home <ChevronRight size={15} />
            </Link>
          </Show>
        </motion.div>

        <button
          type="button"
          className="mobile-menu-btn"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          style={{ display: "none", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: "transparent", border: "1px solid var(--lp-border)", borderRadius: 8, cursor: "pointer", color: "var(--lp-text)" }}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ borderTop: "1px solid var(--lp-border)", background: "rgba(250,250,247,.98)" }}
        >
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="nav-link" style={{ padding: "10px 4px" }}>
                {label}
              </a>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <Show
                when="signed-in"
                fallback={
                  <>
                    <Link href="/sign-in" className="btn-ghost" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    <Link href="/sign-up" className="btn-primary" onClick={() => setMobileOpen(false)}>
                      Get Started <ChevronRight size={15} />
                    </Link>
                  </>
                }
              >
                <Link href="/dashboard" className="btn-primary" onClick={() => setMobileOpen(false)}>
                  Go to Home <ChevronRight size={15} />
                </Link>
              </Show>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
