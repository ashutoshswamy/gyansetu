"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import {
  Sun,
  Network,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import { SiteNavbar } from "./site-navbar";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* Scoped design tokens — landing page only, does not touch the global
   --lp-* tokens shared by the rest of the public site. */
const pageVars = {
  "--gs-ink": "#14172E",
  "--gs-ink-soft": "#1E2240",
  "--gs-paper": "#FBF7EC",
  "--gs-paper-deep": "#F1E8D2",
  "--gs-line": "#E1D6B8",
  "--gs-line-ink": "rgba(251,247,236,.14)",
  "--gs-marigold": "#E8A33D",
  "--gs-rust": "#B8492E",
  "--gs-text": "#1C1A14",
  "--gs-text-soft": "#5C5646",
  "--gs-text-mute": "#948C77",
} as CSSProperties;

const F_DISPLAY = "var(--font-fraunces), serif";
const F_BODY = "var(--font-plex-sans), sans-serif";
const F_MONO = "var(--font-plex-mono), monospace";

const HeroCarousel = dynamic(() => import("./hero-carousel").then((m) => m.HeroCarousel), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", maxWidth: 400, marginLeft: "auto" }}>
      <div style={{ width: "100%", aspectRatio: "4 / 5", borderRadius: 4, background: "var(--gs-ink-soft)", border: "1px solid var(--gs-line-ink)" }} />
    </div>
  ),
});

interface Testimonial {
  id: string;
  name: string;
  batch_year?: string | null;
  role?: string | null;
  message: string;
}

interface LandingPageProps {
  testimonials?: Testimonial[];
}

/* ── Reusable button styles (ink sections vs. paper sections) ── */
const btnMarigold: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--gs-marigold)", color: "var(--gs-ink)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 700, letterSpacing: "0.02em",
  padding: "13px 28px", borderRadius: 3, textDecoration: "none",
};
const btnOutlinePaper: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "transparent", color: "var(--gs-paper)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 600,
  padding: "12px 27px", borderRadius: 3, textDecoration: "none",
  border: "1.5px solid rgba(251,247,236,.3)",
};
const btnInk: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "var(--gs-ink)", color: "var(--gs-paper)",
  fontFamily: F_BODY, fontSize: 13.5, fontWeight: 700,
  padding: "12px 26px", borderRadius: 3, textDecoration: "none",
};

/* ── Eyebrow label — a field-log coordinate/reference line ── */
function Eyebrow({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "paper" }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        fontFamily: F_MONO, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "var(--gs-marigold)", marginBottom: 14,
      }}
    >
      <span style={{ display: "inline-block", width: 22, height: 1.5, background: "var(--gs-marigold)" }} />
      {children}
    </span>
  );
}

/* ── Animated stat, ledger style ── */
function AnimatedStat({ value, label, delay = 0, tone = "paper" }: { value: string; label: string; delay?: number; tone?: "paper" | "ink" }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  const valColor = tone === "ink" ? "var(--gs-paper)" : "var(--gs-ink)";
  const lblColor = tone === "ink" ? "rgba(251,247,236,.5)" : "var(--gs-text-mute)";
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 0.68, 0, 1.2] }}
    >
      <div style={{ fontFamily: F_MONO, fontSize: 26, fontWeight: 600, color: valColor, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: F_BODY, fontSize: 11.5, color: lblColor, marginTop: 6, fontWeight: 500 }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ── Main component ── */
export function LandingPage({ testimonials = [] }: LandingPageProps) {
  const { isSignedIn: isLoggedIn } = useAuth();
  const whatRef = useRef<HTMLDivElement>(null);
  const howRef  = useRef<HTMLDivElement>(null);
  const whatInView = useInView(whatRef, { once: true, margin: "-80px" });
  const howInView  = useInView(howRef,  { once: true, margin: "-80px" });

  const storyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: storyProgress } = useScroll({ target: storyRef, offset: ["start 0.75", "end 0.4"] });
  const storyLineScale = useTransform(storyProgress, [0, 1], [0, 1]);

  return (
    <main
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      style={{ ...pageVars, fontFamily: F_BODY }}
    >

      <SiteNavbar />

      {/* ── HERO ── */}
      <section style={{ minHeight: "calc(100vh - 64px)", marginTop: 64, display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "var(--gs-ink)" }}>
        {/* Fine coordinate grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(var(--gs-line-ink) 1px,transparent 1px),linear-gradient(90deg,var(--gs-line-ink) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Ambient glows */}
        <motion.div
          style={{ position: "absolute", width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,163,61,.09) 0%,transparent 65%)", top: "0%", left: "-14%", pointerEvents: "none" }}
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: "absolute", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(184,73,46,.14) 0%,transparent 65%)", bottom: "-6%", right: "-4%", pointerEvents: "none" }}
          animate={{ x: [0, -22, 0], y: [0, 16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div
          className="hero-grid"
          style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", width: "100%", position: "relative", zIndex: 1 }}
        >
          {/* Left text */}
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Eyebrow>Pune, India &middot; Est. 2013</Eyebrow>
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(46px,6.5vw,80px)", fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.02em", color: "var(--gs-paper)", margin: "0 0 8px" }}>
              <motion.span
                style={{ display: "inline-block" }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 0.68, 0, 1.2] }}
              >
                Gyan
              </motion.span>
              <motion.span
                style={{ display: "inline-block", color: "var(--gs-marigold)" }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 0.68, 0, 1.2] }}
              >
                -
              </motion.span>
              <motion.span
                style={{ color: "var(--gs-paper)", fontStyle: "italic", fontWeight: 500, display: "inline-block" }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 0.68, 0, 1.2] }}
              >
                Setu
              </motion.span>
              <motion.span
                style={{ display: "block", fontFamily: F_DISPLAY, fontSize: "clamp(18px,2.5vw,30px)", fontWeight: 400, fontStyle: "italic", color: "var(--gs-marigold)", letterSpacing: "0.01em", marginTop: 8 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.62 }}
              >
                ज्ञान सेतू — a bridge of knowledge
              </motion.span>
            </h1>

            {/* Body */}
            <motion.p
              style={{ fontFamily: F_BODY, fontSize: 16.5, lineHeight: 1.72, color: "rgba(251,247,236,.68)", maxWidth: 460, margin: "24px 0 36px" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.56 }}
            >
              Be a part of a unique journey of learning, service, and national integration. Join Gyan-Setu as a volunteer and create meaningful impact while experiencing India&apos;s rich cultural diversity.
            </motion.p>

            {/* CTAs */}
            <motion.div
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link href={isLoggedIn ? "/dashboard" : "/sign-up"} style={btnMarigold}>
                {isLoggedIn ? "Go to Home" : "Apply for a Visit"}
                <ChevronRight size={16} />
              </Link>
              <a href="#how-it-works" style={btnOutlinePaper}>Learn More</a>
            </motion.div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 36, marginTop: 52, flexWrap: "wrap" }}>
              {[
                { val: "91,348", lbl: "Students Connected", d: 0.82 },
                { val: "1,688",  lbl: "Schools Reached",     d: 0.9  },
                { val: "14",     lbl: "States & UT",         d: 0.98 },
                { val: "1,050",  lbl: "Volunteers Engaged",  d: 1.06 },
              ].map((s) => (
                <AnimatedStat key={s.lbl} value={s.val} label={s.lbl} delay={s.d} tone="ink" />
              ))}
            </div>
          </div>

          {/* Right: hero visual — photo carousel from the field */}
          <div
            className="hero-visual"
            style={{ position: "relative", width: "100%", height: 540, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
          >
            <motion.div
              style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 0.68, 0, 1.2] }}
            >
              <HeroCarousel />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section
        ref={whatRef}
        style={{ background: "var(--gs-paper)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,163,61,.1) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", position: "relative", zIndex: 1 }}>
          <div className="what-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 56, alignItems: "start", marginBottom: 56 }}>
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={whatInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
                <Eyebrow>Field Activities</Eyebrow>
              </motion.div>
              <motion.h2
                style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: 0 }}
                initial={{ opacity: 0, y: 24 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
              >
                What We Do
              </motion.h2>
            </div>

            <div>
              <motion.p
                style={{ fontFamily: F_BODY, fontSize: 16, color: "var(--gs-text-soft)", lineHeight: 1.75, margin: "0 0 24px" }}
                initial={{ opacity: 0, y: 16 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.14 }}
              >
                Gyan-Setu is a year-long volunteer initiative by Jnana Prabodhini&apos;s Educational Activity Research
                Centre (EARC). Volunteers conduct joyful, hands-on science and mathematics workshops, along with
                career guidance sessions and the &ldquo;Know Our Country&rdquo; Exhibition, in remote, tribal, and
                aspirational regions across India. The programme fosters scientific curiosity, knowledge exchange,
                cultural understanding, and national integration.
              </motion.p>

              <motion.a
                href="#how-it-works"
                style={{ ...btnInk, padding: "11px 26px", fontSize: 12.5, letterSpacing: "0.06em", textTransform: "uppercase" }}
                initial={{ opacity: 0, y: 12 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.26 }}
                whileHover={{ scale: 1.03 }}
              >
                Learn More
              </motion.a>
            </div>
          </div>

          <div className="what-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: <Sun size={24} stroke="var(--gs-rust)" strokeWidth={1.75} />, desc: "Conduct joyful, hands-on science and mathematics workshops for middle school students" },
              { icon: <Network size={24} stroke="var(--gs-rust)" strokeWidth={1.75} />, desc: "Build a network of volunteers, communities, and grassroots organizations to strengthen this “Knowledge Bridge”" },
              { icon: <TrendingUp size={24} stroke="var(--gs-rust)" strokeWidth={1.75} />, desc: "Organize volunteer visits to remote, tribal, and aspirational regions of India to promote national integration through education and cultural exchange" },
            ].map((item, i) => (
              <motion.div
                key={i}
                style={{ position: "relative", background: "var(--gs-paper-deep)", border: "1px dashed var(--gs-line)", borderRadius: 3, padding: "26px 22px 22px" }}
                initial={{ opacity: 0, y: 28 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.36 + i * 0.12, ease: [0.22, 0.68, 0, 1.2] }}
                whileHover={{ y: -3 }}
              >
                <span style={{
                  position: "absolute", top: -1, left: 20, background: "var(--gs-ink)", color: "var(--gs-marigold)",
                  fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
                  padding: "3px 9px", borderRadius: "0 0 3px 3px",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ marginTop: 14, marginBottom: 16 }}>{item.icon}</div>
                <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-soft)", lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section id="our-story" style={{ background: "var(--gs-paper-deep)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}>
        <div ref={storyRef} className="story-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", display: "grid", gridTemplateColumns: "300px 1fr", gap: 64 }}>
          <div style={{ position: "sticky", top: 100, alignSelf: "start" }}>
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <Eyebrow>Our Story</Eyebrow>
            </motion.div>
            <motion.h2
              style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, fontStyle: "italic", lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: "0 0 24px" }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              Since 2013
            </motion.h2>

            <div style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, color: "var(--gs-text-mute)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Where We&apos;ve Worked — 11 States &amp; UTs
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {["Arunachal Pradesh", "Assam", "Chhattisgarh", "Jammu & Kashmir", "Jharkhand", "Ladakh", "Madhya Pradesh", "Manipur", "Meghalaya", "Nagaland", "Odisha"].map((state, i) => (
                <motion.span
                  key={state}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.04 }}
                  whileHover={{ scale: 1.06, borderColor: "var(--gs-rust)", color: "var(--gs-rust)" }}
                  style={{ fontFamily: F_MONO, fontSize: 11, color: "var(--gs-text-mute)", border: "1px solid var(--gs-line)", borderRadius: 20, padding: "5px 11px", cursor: "default" }}
                >
                  {state}
                </motion.span>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }}>
            {/* Scroll-linked reading progress rail */}
            <div style={{ position: "absolute", left: -33, top: 4, bottom: 4, width: 2, background: "var(--gs-line)", borderRadius: 1 }} className="story-rail">
              <motion.div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,var(--gs-rust),var(--gs-marigold))", transformOrigin: "top", scaleY: storyLineScale, borderRadius: 1 }} />
            </div>

            {[
              "At Gyan-Setu, our journey began in 2013 with a visionary idea: to promote national integration through activity-based learning. We set out to bridge through education in India’s remote, tribal, and underserved regions, using science, mathematics and exhibition as a tool to connect, empower, and inspire.",
              "As an initiative of Jnana Prabodhini’s Educational Activity Research Centre (EARC), we have conducted hands-on science and mathematics workshops in schools located in some of the country’s most underserved, aspirational and culturally diverse regions. From the tranquil hills of Arunachal Pradesh and Meghalaya to the vibrant cultures of Assam, Manipur, and Nagaland, and from the rugged terrains of Chhattisgarh, Odisha, Jharkhand, Madhya Pradesh, to the remote schools of Ladakh and Jammu & Kashmir, our efforts span diverse landscapes and communities.",
            ].map((para, i) => (
              <motion.p
                key={i}
                style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", lineHeight: 1.8, maxWidth: 640, marginBottom: 18 }}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.06 }}
              >
                {para}
              </motion.p>
            ))}

            {/* Pull quote break */}
            <motion.blockquote
              style={{ margin: "36px 0", padding: "4px 0 4px 24px", borderLeft: "3px solid var(--gs-rust)" }}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <p style={{ fontFamily: F_DISPLAY, fontSize: 24, fontStyle: "italic", fontWeight: 500, color: "var(--gs-rust)", lineHeight: 1.4, margin: 0, maxWidth: 560 }}>
                Volunteers not only teach, but also learn, live, and grow with the communities they serve.
              </p>
            </motion.blockquote>

            {[
              "Driven by the spirit of volunteerism, Gyan-Setu brings together passionate individuals mostly college students and young professionals from across India. Through language exchange, homestays, traditional meals, and shared experiences, they form lasting human bonds and develop a deep understanding of India’s social and cultural fabric.",
              "With the support of local partner organizations, we continue to build human bridges through knowledge exchange, nurturing curiosity, compassion, and confidence in young learners while transforming volunteers into socially responsible, culturally aware changemakers for the nation.",
              "As we grow, we invite you to join this movement. Together, let’s create a future where every child, no matter where they live, has access to joyful learning and a sense of belonging in a united India.",
            ].map((para, i) => (
              <motion.p
                key={i}
                style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", lineHeight: 1.8, maxWidth: 640, marginBottom: 18 }}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.06 }}
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        ref={howRef}
        style={{ background: "var(--gs-paper)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ marginBottom: 56 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={howInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <Eyebrow>Itinerary</Eyebrow>
            </motion.div>
            <motion.h2
              style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: 0 }}
              initial={{ opacity: 0, y: 18 }}
              animate={howInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              How It Works
            </motion.h2>
          </div>

          <div>
            {[
              { num: "01", title: "Register, Apply & Pre-Test", desc: "Create your Gyan-Setu profile, complete the registration form, apply for a tour, and take the pre-test to begin your volunteer journey and attending the annual event (15 August Melawa and 26 January Katta)" },
              { num: "02", title: "Orientation & Training", desc: "Attend the mandatory orientation, training sessions, and demo workshops to understand Gyan-Setu's mission, educational activities, and volunteer responsibilities" },
              { num: "03", title: "Selection & Team Formation", desc: "Complete the interview and selection process. Selected volunteers are grouped into teams and assigned a state based on programme requirements" },
              { num: "04", title: "Preparation & State Study", desc: "Prepare with your team by planning activities, coordinating logistics, and studying the history, culture, geography, language, and local context of your allotted state" },
              { num: "05", title: "School & Community Visit", desc: "Travel to the assigned region to conduct science and mathematics workshops, career guidance sessions, the “Know Our Country” Exhibition, and participate in meaningful cultural understanding with schools and local communities" },
              { num: "06", title: "Reflection & Continued Engagement", desc: "Submit reports and post test feedback, receive your volunteer certificate, participate in annual Gyan-Setu events (15 August Melawa and 26 January Katta), and continue as an active member of the Gyan-Setu volunteer network", active: true },
            ].map((step, i, arr) => (
              <motion.div
                key={i}
                style={{
                  display: "flex", gap: 22, alignItems: "stretch",
                  borderBottom: i < arr.length - 1 ? "1px dashed var(--gs-line)" : "none",
                  paddingBottom: 22, marginBottom: 22, position: "relative",
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={howInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.15 + i * 0.09, ease: [0.22, 0.68, 0, 1.2] }}
              >
                {/* Ticket-stub code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 64 }}>
                  <motion.div
                    style={{
                      width: 52, height: 52, borderRadius: "50%",
                      border: step.active ? "none" : "1.5px solid var(--gs-line)",
                      background: step.active ? "var(--gs-rust)" : "var(--gs-paper-deep)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", flexShrink: 0,
                    }}
                    whileHover={{ scale: 1.06 }}
                  >
                    {step.active && (
                      <motion.div
                        style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1.5px solid rgba(184,73,46,.35)" }}
                        animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0, 0.9] }}
                        transition={{ duration: 2.8, repeat: Infinity }}
                      />
                    )}
                    <span style={{ fontFamily: F_MONO, fontSize: 13, fontWeight: 600, color: step.active ? "var(--gs-paper)" : "var(--gs-text-mute)", letterSpacing: "0.02em" }}>
                      GS·{step.num}
                    </span>
                  </motion.div>
                </div>

                {/* Text */}
                <div style={{ paddingTop: 4, flex: 1 }}>
                  <div style={{ fontFamily: F_BODY, fontSize: 15.5, fontWeight: 600, color: "var(--gs-text)", marginBottom: 8 }}>{step.title}</div>
                  <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "var(--gs-text-mute)", lineHeight: 1.7, maxWidth: 560, margin: 0 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ background: "var(--gs-paper-deep)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
            <div>
              <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <Eyebrow>Alumni Voices</Eyebrow>
              </motion.div>
              <motion.h2
                style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--gs-text)", margin: "0 0 12px" }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.1 }}
              >
                What Our Alumni Say
              </motion.h2>
              <motion.p
                style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-soft)", maxWidth: 480, margin: 0 }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.18 }}
              >
                Thousands of students have travelled across India with Gyan Setu. Here are their stories.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.26 }}
              style={{ flexShrink: 0 }}
            >
              <Link href="/testimonial" style={btnInk}>
                Share Your Experience
                <ChevronRight size={15} />
              </Link>
            </motion.div>
          </div>

          {testimonials.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 22 }}>
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  style={{ position: "relative", background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 4, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 16 }}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.09, ease: [0.22, 0.68, 0, 1.2] }}
                >
                  {/* Postmark corner */}
                  <div style={{
                    position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%",
                    border: "1.5px dashed var(--gs-rust)", opacity: 0.55,
                  }} />
                  <div style={{ color: "var(--gs-marigold)", fontFamily: F_DISPLAY, fontSize: 34, lineHeight: 0.5, fontWeight: 700 }}>&ldquo;</div>
                  <p style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text-soft)", lineHeight: 1.75, margin: 0, flex: 1 }}>
                    {t.message}
                  </p>
                  <div style={{ borderTop: "1px dashed var(--gs-line)", paddingTop: 14 }}>
                    <div style={{ fontFamily: F_BODY, fontSize: 14, fontWeight: 600, color: "var(--gs-text)" }}>{t.name}</div>
                    {(t.role || t.batch_year) && (
                      <div style={{ fontFamily: F_MONO, fontSize: 11.5, color: "var(--gs-text-mute)", marginTop: 3 }}>
                        {[t.role, t.batch_year].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              style={{ textAlign: "center", padding: "40px 24px", background: "var(--gs-paper)", border: "1px dashed var(--gs-line)", borderRadius: 4 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p style={{ fontFamily: F_BODY, fontSize: 15, color: "var(--gs-text-mute)", margin: 0 }}>
                Be the first to share your Gyan Setu experience.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── ALUMNI NETWORK ── */}
      <section id="alumni" style={{ background: "var(--gs-paper)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}>
        <div className="career-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 72, alignItems: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <Eyebrow>Alumni Network</Eyebrow>
            <h2 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--gs-text)", margin: "0 0 20px" }}>
              Your Journey{" "}
              <span style={{ color: "var(--gs-rust)", fontStyle: "italic" }}>Doesn&apos;t End Here</span>
            </h2>
            <p style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", lineHeight: 1.75, marginBottom: 28 }}>
              Your Gyan-Setu journey doesn&apos;t end with a visit. Join our alumni network to reconnect, share your experiences, and inspire the next generation of volunteers.
            </p>
            <Link href="/alumni" style={btnInk}>
              Register as Alumni <ChevronRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            style={{ background: "var(--gs-ink)", borderRadius: 6, padding: "44px 36px", position: "relative", overflow: "hidden" }}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <div style={{ position: "absolute", top: -30, right: -20, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,163,61,.12) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontFamily: F_DISPLAY, fontSize: 64, lineHeight: 0.6, color: "var(--gs-marigold)", marginBottom: 18 }}>&ldquo;</div>
            <p style={{ fontFamily: F_DISPLAY, fontSize: 26, fontStyle: "italic", fontWeight: 500, color: "var(--gs-paper)", lineHeight: 1.35, margin: "0 0 24px" }}>
              once a Gyan-Setu Volunteer, always one.
            </p>
            <p style={{ fontFamily: F_MONO, fontSize: 12, color: "rgba(251,247,236,.5)", margin: 0, letterSpacing: "0.02em" }}>
              Reconnect. Share your story. Guide the next generation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── COLLABORATE WITH GYAN-SETU ── */}
      <section id="institutions" style={{ background: "var(--gs-paper-deep)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}>
        <div className="career-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 72, alignItems: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <Eyebrow>For Institutions</Eyebrow>
            <h2 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--gs-text)", margin: "0 0 20px" }}>
              Collaborate with{" "}
              <span style={{ color: "var(--gs-rust)", fontStyle: "italic" }}>Gyan-Setu</span>
            </h2>
            <p style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", lineHeight: 1.75, marginBottom: 28 }}>
              Collaborate to create engaging learning experiences for your students. Together, we can inspire scientific curiosity, cultural understanding, and a spirit of national integration.
            </p>
            <Link href="/institution" style={btnInk}>
              Apply Now <ChevronRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, color: "var(--gs-text-mute)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>What We Bring</div>
            {["Science & Mathematics Workshops", "Career Guidance Sessions", "“Know Our Country” Exhibition"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--gs-paper)", border: "1px solid var(--gs-line)", borderRadius: 3, padding: "14px 18px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(184,73,46,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="var(--gs-rust)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontFamily: F_BODY, fontSize: 14, color: "var(--gs-text)", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BE A SPONSOR ── */}
      <section style={{ background: "var(--gs-paper)", borderTop: "1px solid var(--gs-line)", borderBottom: "1px solid var(--gs-line)" }}>
        <div className="career-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 72, alignItems: "center" }}>
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            <Eyebrow>Partnerships</Eyebrow>
            <h2 style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--gs-text)", margin: "0 0 20px" }}>
              Be a Sponsor,{" "}
              <span style={{ color: "var(--gs-rust)", fontStyle: "italic" }}>Shape Young India</span>
            </h2>
            <p style={{ fontFamily: F_BODY, fontSize: 15.5, color: "var(--gs-text-soft)", lineHeight: 1.75, marginBottom: 28 }}>
              Your sponsorship powers activity-based learning workshops in remote schools, supports volunteer travel, and helps bridge knowledge gaps across India. Partner with Gyan Setu and invest in a generation of curious, connected young minds.
            </p>
            <Link href="/sponsor" style={btnMarigold}>
              Become a Sponsor <ChevronRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 0.68, 0, 1.2] }}
          >
            {[
              { num: "1,688", label: "Schools Reached" },
              { num: "14",    label: "States & UT" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "var(--gs-paper-deep)", border: "1px solid var(--gs-line)", borderRadius: 3, padding: "26px 28px", display: "flex", gap: 22, alignItems: "center" }}>
                <div style={{ fontFamily: F_MONO, fontSize: 36, fontWeight: 600, color: "var(--gs-rust)", lineHeight: 1, flexShrink: 0 }}>{stat.num}</div>
                <div style={{ fontFamily: F_BODY, fontSize: 14, fontWeight: 600, color: "var(--gs-text)" }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ background: "var(--gs-ink)", padding: "88px 24px", position: "relative", overflow: "hidden" }}>
        <motion.div
          style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(232,163,61,.08) 0%,transparent 70%)", top: "50%", left: "18%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: "absolute", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(184,73,46,.14) 0%,transparent 70%)", top: "30%", right: "12%", pointerEvents: "none" }}
          animate={{ scale: [1, 1.35, 1], x: [0, -18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--gs-line-ink) 1px,transparent 1px),linear-gradient(90deg,var(--gs-line-ink) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.h2
            style={{ fontFamily: F_DISPLAY, fontSize: "clamp(32px,4.5vw,54px)", fontWeight: 600, color: "var(--gs-paper)", letterSpacing: "-0.022em", margin: "0 0 18px", lineHeight: 1.1 }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            Ready to Explore India?
          </motion.h2>
          <motion.p
            style={{ fontFamily: F_BODY, fontSize: 15.5, color: "rgba(251,247,236,.58)", marginBottom: 42, lineHeight: 1.65 }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.14 }}
          >
            Create your account, apply for an upcoming Gyan-Setu Visit, and take the eligibility test. Selected volunteers travel across India as Gyan-Setu, EARC Jnana Prabodhini volunteers.
          </motion.p>
          <motion.div
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.26 }}
          >
            {isLoggedIn ? (
              <Link href="/dashboard" style={btnMarigold}>Go to Home</Link>
            ) : (
              <>
                <Link href="/sign-up" style={btnMarigold}>Apply Now</Link>
                <Link href="/sign-in" style={btnOutlinePaper}>Sign In</Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--gs-ink)", borderTop: "1px solid var(--gs-line-ink)" }}>
        {/* Main footer grid */}
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px 48px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">
          {/* Brand column */}
          <div>
            <Image src="/logo_wide.png" alt="Gyan Setu" width={120} height={36} style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 18 }} />
            <p style={{ fontFamily: F_BODY, fontSize: 13.5, color: "rgba(251,247,236,.45)", lineHeight: 1.75, maxWidth: 300, marginBottom: 24 }}>
              Jnana Prabodhini Educational Activity Research Centre. Building bridges of knowledge across India since 2013.
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              {[
                { href: "https://www.facebook.com/share/19gufTtRBK/?mibextid=wwXIfr", label: "Facebook", hoverBg: "#1877F2", hoverColor: "white", path: "M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" },
                { href: "https://www.instagram.com/gyan_setu_?igsh=MTNzbHBxbmo3OXZiYQ==", label: "Instagram", hoverBg: "#E1306C", hoverColor: "white", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                { href: "https://www.linkedin.com/company/gyan-setu/", label: "LinkedIn", hoverBg: "#0A66C2", hoverColor: "white", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { href: "https://youtube.com/@gyansetuyoutubechannel?si=Fc1wprxTfw55Rmnn", label: "YouTube", hoverBg: "#FF0000", hoverColor: "white", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
              ].map(({ href, label, hoverBg, hoverColor, path }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ width: 36, height: 36, borderRadius: 4, background: "rgba(251,247,236,.06)", border: "1px solid rgba(251,247,236,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(251,247,236,.5)", transition: "all .2s", flexShrink: 0 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = hoverBg; el.style.color = hoverColor; el.style.borderColor = hoverBg; el.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "rgba(251,247,236,.06)"; el.style.color = "rgba(251,247,236,.5)"; el.style.borderColor = "rgba(251,247,236,.1)"; el.style.transform = "translateY(0)"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Explore column */}
          <div>
            <div style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, color: "rgba(251,247,236,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Explore</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Gallery", href: "/gallery" },
                { label: "Visits", href: "/visits" },
                { label: "Blog", href: "/blog" },
                { label: "Newsletter", href: "/newsletter" },
                { label: "FAQ",        href: "/faq"        },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: F_BODY, fontSize: 13.5, color: "rgba(251,247,236,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Get Involved column */}
          <div>
            <div style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, color: "rgba(251,247,236,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Get Involved</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Apply for a Tour", href: isLoggedIn ? "/dashboard" : "/sign-up" },
                { label: "Register as Alumni", href: "/alumni" },
                { label: "Share Your Story", href: "/testimonial" },
                { label: "Be a Sponsor", href: "/sponsor" },
                { label: isLoggedIn ? "Home" : "Sign In", href: isLoggedIn ? "/dashboard" : "/sign-in" },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: F_BODY, fontSize: 13.5, color: "rgba(251,247,236,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Contact column */}
          <div>
            <div style={{ fontFamily: F_MONO, fontSize: 10.5, fontWeight: 600, color: "rgba(251,247,236,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: "rgba(251,247,236,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Address</div>
                <a href="https://goo.gl/maps/XptGcSa9XG8C7aFq7" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F_BODY, fontSize: 13, color: "rgba(251,247,236,.5)", lineHeight: 1.65, textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                >
                  510, 1st Floor EARC<br />
                  Jnana Prabodhini, Sadashiv Peth<br />
                  Pune - 411030
                </a>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: "rgba(251,247,236,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Phone</div>
                <div style={{ fontFamily: F_BODY, fontSize: 13, color: "rgba(251,247,236,.5)", lineHeight: 1.65 }}>
                  9325585695<br />
                  020-24207209
                </div>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: "rgba(251,247,236,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
                <a href="mailto:gyansetu@jnanaprabodhini.org" style={{ fontFamily: F_BODY, fontSize: 13, color: "rgba(251,247,236,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                >
                  gyansetu@jnanaprabodhini.org
                </a>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: "rgba(251,247,236,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Websites</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <a href="https://earc.jnanaprabodhini.org/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F_BODY, fontSize: 13, color: "rgba(251,247,236,.5)", textDecoration: "none", transition: "color .18s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                  >
                    EARC
                  </a>
                  <a href="https://www.jnanaprabodhini.org/" target="_blank" rel="noopener noreferrer" style={{ fontFamily: F_BODY, fontSize: 13, color: "rgba(251,247,236,.5)", textDecoration: "none", transition: "color .18s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.5)"; }}
                  >
                    Jnana Prabodhini
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid var(--gs-line-ink)", padding: "20px 24px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p suppressHydrationWarning style={{ fontFamily: F_MONO, fontSize: 11.5, color: "rgba(251,247,236,.28)", margin: 0 }}>
              © {new Date().getFullYear()} Jnana Prabodhini Educational Resource Centre. All rights reserved.
            </p>
            <p style={{ fontFamily: F_MONO, fontSize: 11.5, color: "rgba(251,247,236,.28)", margin: 0 }}>
              Made by{" "}
              <a href="https://anahat-entertainment.vercel.app" target="_blank" rel="noopener noreferrer"
                style={{ color: "rgba(251,247,236,.45)", fontWeight: 600, textDecoration: "none", transition: "color .18s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--gs-paper)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(251,247,236,.45)"; }}
              >
                Anahat Entertainment
              </a>
            </p>
          </div>
        </div>
      </footer>

    </main>
  );
}
