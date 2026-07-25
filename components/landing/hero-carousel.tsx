"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TOTAL_POSTS = 260;
const SLIDE_COUNT = 8;
const WORDS = ["bloom", "wander", "kindred", "curious", "gather", "horizon", "kinship", "wonder"];

function pickRandomSlides() {
  const pool = Array.from({ length: TOTAL_POSTS }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SLIDE_COUNT).map((n, i) => ({ src: `/posts/${n}.png`, word: WORDS[i % WORDS.length] }));
}

const AUTOPLAY_MS = 4800;

export function HeroCarousel() {
  // Lazy initializer runs once per mount; this component is loaded client-only
  // (see the dynamic(..., { ssr: false }) import in landing-page.tsx) so each
  // visit gets a fresh random set with no server/client hydration mismatch.
  const [slides] = useState(() => pickRandomSlides());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || reduceMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, reduceMotion, slides.length]);

  function go(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  return (
    <div
      style={{ position: "relative", width: "100%", maxWidth: 400, marginLeft: "auto" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Field-note tag */}
      <div
        style={{
          position: "absolute", top: -18, left: -18, zIndex: 2,
          background: "var(--lp-navy)", color: "white",
          fontFamily: "'Poppins',sans-serif", fontSize: 11.5, fontWeight: 600,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "7px 14px", borderRadius: 20,
          boxShadow: "0 6px 18px rgba(46,53,112,.28)",
        }}
      >
        Live from the field
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 5",
          borderRadius: 16,
          overflow: "hidden",
          background: "#F3F0E8",
          border: "1px solid var(--lp-border)",
          boxShadow: "0 18px 44px rgba(25,20,15,.16)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 0.68, 0, 1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Image
              src={slides[index].src}
              alt={`Gyan-Setu volunteers in the field — ${slides[index].word}`}
              fill
              sizes="(max-width: 768px) 80vw, 320px"
              style={{ objectFit: "cover" }}
              priority={index === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Arrow controls */}
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(index - 1)}
          style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            width: 34, height: 34, borderRadius: "50%", border: "none",
            background: "rgba(25,20,15,.4)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 2,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(index + 1)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            width: 34, height: 34, borderRadius: "50%", border: "none",
            background: "rgba(25,20,15,.4)", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 2,
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Caption + dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 12 }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: 15, color: "var(--lp-tm)", margin: 0 }}>
          {slides[index].word}
        </p>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => go(i)}
              style={{
                width: i === index ? 16 : 6, height: 6, borderRadius: 3, border: "none",
                background: i === index ? "var(--lp-navy)" : "var(--lp-border)",
                cursor: "pointer", transition: "all 0.25s ease", padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
