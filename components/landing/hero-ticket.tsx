"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";

// Real field photos from public/posts. Each post is photo-on-top, caption band below;
// the window crops the band off with object-position: top.
export const DESTINATIONS = [
  { n: 3, place: "Sukma", state: "Chhattisgarh", alt: "Volunteers meet a village gathering in Sukma, Chhattisgarh" },
  { n: 17, place: "Ramban", state: "Jammu and Kashmir", alt: "Students in headscarves seated for a session in Ramban" },
  { n: 88, place: "Majuli", state: "Assam", alt: "Volunteers seated in front of a satra in Majuli, Assam" },
  { n: 130, place: "Leh", state: "Ladakh", alt: "Volunteers in conversation on a garden terrace in Ladakh" },
  { n: 170, place: "Mon", state: "Nagaland", alt: "Hundreds of students in a hall for a workshop in Mon, Nagaland" },
  { n: 210, place: "Tinsukia", state: "Assam", alt: "Children holding up cards in a classroom in Tinsukia, Assam" },
] as const;

const CYCLE_MS = 5200;

export function HeroTicket() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const running = !reduce && !paused && !hover;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setI((v) => (v + 1) % DESTINATIONS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [running]);

  const d = DESTINATIONS[i];

  return (
    <div
      className="gl-ticket-wrap"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="gl-ticket">
        <div className="gl-ticket-main">
          <div className="gl-window">
            {DESTINATIONS.map((x, k) => (
              <Image
                key={x.n}
                src={`/posts/${x.n}.png`}
                alt={k === i ? x.alt : ""}
                aria-hidden={k !== i}
                fill
                sizes="(max-width: 640px) 80vw, 280px"
                priority={k === 0}
                style={{ opacity: k === i ? 1 : 0, transition: "opacity .7s var(--ease)" }}
              />
            ))}
            {!reduce && (
              <button
                type="button"
                className="gl-pause"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume destination slideshow" : "Pause destination slideshow"}
              >
                <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={18} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="gl-fields">
            <div className="gl-brand-row">
              <b>Gyan-Setu</b>
              <span lang="mr">ज्ञान सेतू</span>
            </div>

            <div className="gl-route">
              <div>
                <span className="gl-lbl">From</span>
                <span className="gl-val">Pune</span>
              </div>
              <div aria-live="off">
                <span className="gl-lbl">To</span>
                <span key={`${d.n}-p`} className="gl-dest gl-print">{d.place}</span>
              </div>
            </div>
            <div>
              <span className="gl-lbl">State</span>
              <span key={`${d.n}-s`} className="gl-val gl-print">{d.state}</span>
            </div>

            <div className="gl-meta">
              <div><span className="gl-lbl">Passenger</span><span className="gl-val">You</span></div>
              <div><span className="gl-lbl">Class</span><span className="gl-val">Volunteer</span></div>
              <div><span className="gl-lbl">Valid</span><span className="gl-val">1 year</span></div>
            </div>
          </div>
        </div>

        <div className="gl-ticket-stub" aria-hidden="true">
          <div className="gl-barcode" />
          <div className="gl-admit">
            Admit one
            <small>Jnana Prabodhini EARC</small>
          </div>
        </div>
      </div>
      <div className="gl-stamp" aria-hidden="true">
        <span>
          Since
          <b>2013</b>
        </span>
      </div>
    </div>
  );
}
