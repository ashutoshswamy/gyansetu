"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sun,
  Network,
  TrendingUp,
  Home,
  ClipboardCheck,
  Users,
  ChevronRight,
} from "lucide-react";
import { AlumniSection } from "./alumni-section";

interface Testimonial {
  id: string;
  name: string;
  batch_year?: string | null;
  role?: string | null;
  message: string;
}

interface LandingPageProps {
  isLoggedIn: boolean;
  testimonials?: Testimonial[];
}

/* ── Animated stat ── */
function AnimatedStat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 0.68, 0, 1.2] }}
    >
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 30, fontWeight: 700, color: "var(--lp-navy)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11.5, color: "var(--lp-tm)", marginTop: 5, fontWeight: 400 }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ── 3D Tilt Card ── */
function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-0.5, 0.5], [7, -7]);
  const rotY = useTransform(x, [-0.5, 0.5], [-7, 7]);
  const sRotX = useSpring(rotX, { stiffness: 280, damping: 28 });
  const sRotY = useSpring(rotY, { stiffness: 280, damping: 28 });

  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: sRotX, rotateY: sRotY, transformStyle: "preserve-3d", ...style }}
      whileHover={{ scale: 1.02, boxShadow: "0 12px 48px rgba(74,85,190,0.13)" }}
      transition={{ scale: { duration: 0.22 }, boxShadow: { duration: 0.22 } }}
    >
      {children}
    </motion.div>
  );
}

/* ── Floating hero card ── */
function FloatingCard({
  children,
  delay = 0,
  bobDuration = 3.5,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  bobDuration?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 48, y: 16 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.85, delay, ease: [0.22, 0.68, 0, 1.2] }}
      style={style}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut", delay: delay * 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Main component ── */
export function LandingPage({ isLoggedIn, testimonials = [] }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const whatRef = useRef<HTMLDivElement>(null);
  const howRef  = useRef<HTMLDivElement>(null);
  const featRef = useRef<HTMLDivElement>(null);
  const whatInView = useInView(whatRef, { once: true, margin: "-80px" });
  const howInView  = useInView(howRef,  { once: true, margin: "-80px" });
  const featInView = useInView(featRef, { once: true, margin: "-80px" });

  const navLinks = [
    { label: "How It Works", href: "#how-it-works"  },
    { label: "Features",     href: "#features"      },
    { label: "Visits",       href: "/visits"        },
    { label: "Gallery",      href: "/gallery"       },
    { label: "Blog",         href: "/blog"          },
  ];

  return (
    <main style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <motion.nav
        style={{
          position: "sticky", top: 0, zIndex: 50,
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
            <Image src="/logo_wide.png" alt="Gyan Setu" width={135} height={40} style={{ height: 40, width: "auto", objectFit: "contain" }} />
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
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard <ChevronRight size={15} />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="btn-ghost">Sign In</Link>
                <Link href="/sign-up" className="btn-primary">
                  Get Started <ChevronRight size={15} />
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", background: "var(--lp-bg)" }}>
        {/* Background: grid */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(228,223,209,.32) 1px,transparent 1px),linear-gradient(90deg,rgba(228,223,209,.32) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Animated gradient orbs */}
        <motion.div
          style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,85,190,.055) 0%,transparent 65%)", top: "5%", left: "-12%", pointerEvents: "none" }}
          animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: "absolute", width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,165,32,.048) 0%,transparent 65%)", bottom: "0%", right: "0%", pointerEvents: "none" }}
          animate={{ x: [0, -22, 0], y: [0, 16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div
          className="hero-grid"
          style={{ maxWidth: 1120, margin: "0 auto", padding: "80px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center", width: "100%", position: "relative", zIndex: 1 }}
        >
          {/* Left text */}
          <div>
            {/* Eyebrow */}
            <motion.div
              style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 22 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span style={{ display: "inline-block", width: 28, height: 1.5, background: "var(--lp-amber)" }} />
              Jnanaprabodhini Educational Tours
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(46px,6.5vw,78px)", fontWeight: 600, lineHeight: 1.06, letterSpacing: "-0.025em", color: "var(--lp-text)", margin: "0 0 8px" }}>
              {"Explore India,".split(" ").map((w, i) => (
                <motion.span
                  key={i}
                  style={{ display: "inline-block", marginRight: "0.22em" }}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.2 + i * 0.1, ease: [0.22, 0.68, 0, 1.2] }}
                >
                  {w}
                </motion.span>
              ))}
              <br />
              <motion.span
                style={{ color: "var(--lp-navy)", fontStyle: "italic", display: "inline-block" }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.44, ease: [0.22, 0.68, 0, 1.2] }}
              >
                Beyond Borders
              </motion.span>
              <motion.span
                style={{ display: "block", fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(20px,2.8vw,34px)", fontWeight: 400, fontStyle: "italic", color: "var(--lp-tm)", letterSpacing: "0.01em", marginTop: 6 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.68 }}
              >
                ज्ञान सेतू
              </motion.span>
            </h1>

            {/* Body */}
            <motion.p
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16.5, lineHeight: 1.72, color: "var(--lp-ts)", maxWidth: 460, margin: "24px 0 36px" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.56 }}
            >
              Jnanaprabodhini takes students across India to meet government officials, immerse in regional cultures, and build lifelong connections with students from every corner of the country.
            </motion.p>

            {/* CTAs */}
            <motion.div
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Link
                href={isLoggedIn ? "/dashboard" : "/sign-up"}
                className="btn-primary"
              >
                {isLoggedIn ? "Go to Dashboard" : "Apply for a Tour"}
                <ChevronRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-outline">Learn More</a>
            </motion.div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 36, marginTop: 52 }}>
              {[
                { val: "82,800+", lbl: "Students Connected", d: 0.82 },
                { val: "1,585",   lbl: "Schools",            d: 0.9  },
                { val: "11",      lbl: "States & UTs",       d: 0.98 },
                { val: "965+",    lbl: "Volunteers",         d: 1.06 },
              ].map((s) => (
                <AnimatedStat key={s.lbl} value={s.val} label={s.lbl} delay={s.d} />
              ))}
            </div>
          </div>

          {/* Right: hero visual */}
          <div
            className="hero-visual"
            style={{ position: "relative", width: "100%", height: 460, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
          >
            {/* Panel BG */}
            <motion.div
              style={{ position: "absolute", inset: 0, borderRadius: 18, background: "linear-gradient(148deg,#F3F0E8 0%,#fff 100%)", border: "1px solid var(--lp-border)", overflow: "hidden" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 0.68, 0, 1.2] }}
            >
              <div style={{ position: "absolute", inset: 0, opacity: 0.38, backgroundImage: "linear-gradient(var(--lp-border) 1px,transparent 1px),linear-gradient(90deg,var(--lp-border) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
              <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,85,190,.1) 0%,transparent 70%)" }} />
              <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,165,32,.08) 0%,transparent 70%)" }} />
            </motion.div>

            {/* Cards */}
            <div style={{ position: "relative", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14, zIndex: 1, width: "100%" }}>

              <FloatingCard delay={0.5} bobDuration={3.8}>
                <div style={{ background: "white", border: "1px solid var(--lp-border-l)", borderRadius: 12, padding: "18px 20px", boxShadow: "0 4px 28px rgba(74,85,190,.1)" }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lp-amber)", marginBottom: 7 }}>Tour Open</div>
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 17, fontWeight: 600, color: "var(--lp-text)", lineHeight: 1.3, marginBottom: 5 }}>Rajasthan Jnana Pravas 2025</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11.5, color: "var(--lp-tm)", marginBottom: 14 }}>Applications close Dec 15 · 40 seats</div>
                  <span style={{ display: "inline-block", background: "var(--lp-navy)", color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 4, letterSpacing: "0.02em" }}>Apply Now</span>
                </div>
              </FloatingCard>

              <FloatingCard delay={0.68} bobDuration={4.2}>
                <div style={{ background: "white", border: "1px solid var(--lp-border-l)", borderRadius: 12, padding: "18px 20px", boxShadow: "0 4px 20px rgba(74,85,190,.07)" }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-tm)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Your Progress</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, fontWeight: 500, color: "var(--lp-text)" }}>Eligibility Test</span>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: "var(--lp-green)" }}>Passed · 84%</span>
                  </div>
                  <div style={{ height: 5, background: "var(--lp-surface)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", background: "linear-gradient(90deg,var(--lp-green),rgba(42,94,58,.7))", borderRadius: 3 }}
                      initial={{ width: 0 }}
                      animate={{ width: "84%" }}
                      transition={{ duration: 1.3, delay: 1.4, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </FloatingCard>

              <FloatingCard delay={0.86} bobDuration={3.5}>
                <div style={{ background: "var(--lp-navy)", borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
                  <motion.div
                    style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.06)" }}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Status Update</div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, fontWeight: 400, color: "white", lineHeight: 1.55, position: "relative", zIndex: 1 }}>
                    🎉 Congratulations! You&apos;ve been selected as a Volunteer for Rajasthan Jnana Pravas 2025.
                  </div>
                </div>
              </FloatingCard>

            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section
        ref={whatRef}
        style={{ background: "var(--lp-surface)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,165,32,.055) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,85,190,.04) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.h2
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--lp-text)", marginBottom: 20 }}
            initial={{ opacity: 0, y: 24 }}
            animate={whatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            What We Do
          </motion.h2>

          <motion.p
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16, color: "var(--lp-ts)", lineHeight: 1.75, maxWidth: 680, margin: "0 auto 28px" }}
            initial={{ opacity: 0, y: 16 }}
            animate={whatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.14 }}
          >
            &ldquo;Gyan-Setu&rdquo; is a programme conducted by volunteers visiting remote parts of India.
            This year-long programme, organised by Jnanaprabodhini&apos;s Educational Activity Research Centre (EARC),
            consists of visits by teams of volunteers to conduct joyful, science-based workshops and camps
            for middle school students.
          </motion.p>

          <motion.a
            href="#how-it-works"
            style={{ display: "inline-block", background: "var(--lp-amber)", color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 30px", borderRadius: 5, textDecoration: "none", marginBottom: 64 }}
            initial={{ opacity: 0, y: 12 }}
            animate={whatInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.26 }}
            whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(245,165,32,.35)" }}
          >
            Learn More
          </motion.a>

          <div
            className="what-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 48, textAlign: "center", maxWidth: 860, margin: "0 auto" }}
          >
            {[
              { icon: <Sun size={44} stroke="#F5A520" strokeWidth={1.5} />, desc: "Conduct joyful hands-on science workshops for school children in remote communities" },
              { icon: <Network size={44} stroke="#F5A520" strokeWidth={1.5} />, desc: "Build a network of people and grassroot organisations to strengthen this knowledge bridge" },
              { icon: <TrendingUp size={44} stroke="#F5A520" strokeWidth={1.5} />, desc: "Organise volunteer visits to remote parts of India for science popularisation and knowledge exchange" },
            ].map((item, i) => (
              <motion.div
                key={i}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
                initial={{ opacity: 0, y: 36 }}
                animate={whatInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.36 + i * 0.13, ease: [0.22, 0.68, 0, 1.2] }}
              >
                <motion.div
                  style={{ width: 84, height: 84, borderRadius: "50%", background: "white", border: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 16px rgba(245,165,32,.07)" }}
                  whileHover={{ scale: 1.12, boxShadow: "0 10px 32px rgba(245,165,32,.2)" }}
                  transition={{ duration: 0.25 }}
                >
                  {item.icon}
                </motion.div>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "var(--lp-ts)", lineHeight: 1.7, margin: 0 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        ref={howRef}
        style={{ background: "white", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <motion.span
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}
              initial={{ opacity: 0, y: 12 }}
              animate={howInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              Process
            </motion.span>
            <motion.h2
              style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--lp-text)", margin: 0 }}
              initial={{ opacity: 0, y: 18 }}
              animate={howInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              How It Works
            </motion.h2>
          </div>

          <div
            className="steps-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, position: "relative" }}
          >
            {[
              { num: "01", title: "Register",               desc: "Create your account on the portal with your personal and academic details" },
              { num: "02", title: "Apply for a Tour",       desc: "Browse upcoming Jnana Pravas tours and submit your application" },
              { num: "03", title: "Take Eligibility Test",  desc: "Complete the online assessment: MCQ, multi-select, and written sections" },
              { num: "04", title: "Become a Volunteer",     desc: "Selected students lead the tour as volunteers, coordinating and reporting", active: true },
            ].map((step, i) => (
              <motion.div
                key={i}
                style={{ textAlign: "center", position: "relative", padding: "0 12px" }}
                initial={{ opacity: 0, y: 28 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.22 + i * 0.15, ease: [0.22, 0.68, 0, 1.2] }}
              >
                {/* Animated connector line */}
                {i < 3 && (
                  <div style={{ position: "absolute", top: 27, left: "calc(50% + 32px)", width: "calc(100% - 64px)", height: 1, background: "var(--lp-border)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", background: "linear-gradient(90deg,var(--lp-navy),var(--lp-amber))", transformOrigin: "left" }}
                      initial={{ scaleX: 0 }}
                      animate={howInView ? { scaleX: 1 } : {}}
                      transition={{ duration: 0.85, delay: 0.55 + i * 0.2, ease: "easeOut" }}
                    />
                  </div>
                )}

                {/* Step circle */}
                <motion.div
                  style={{
                    width: 54, height: 54, borderRadius: "50%",
                    border: step.active ? "none" : "1.5px solid var(--lp-border)",
                    background: step.active ? "var(--lp-navy)" : "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px", position: "relative", zIndex: 1,
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {step.active && (
                    <motion.div
                      style={{ position: "absolute", inset: -5, borderRadius: "50%", border: "1.5px solid rgba(74,85,190,.35)" }}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0, 0.9] }}
                      transition={{ duration: 2.8, repeat: Infinity }}
                    />
                  )}
                  <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 19, fontWeight: 700, color: step.active ? "white" : "var(--lp-navy)", letterSpacing: "0.02em" }}>
                    {step.num}
                  </span>
                </motion.div>

                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 600, color: "var(--lp-text)", marginBottom: 8 }}>{step.title}</div>
                <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "var(--lp-tm)", lineHeight: 1.65, maxWidth: 160, margin: "0 auto" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" ref={featRef}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
          <div
            className="feat-header"
            style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, marginBottom: 52 }}
          >
            <div>
              <motion.span
                style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}
                initial={{ opacity: 0 }}
                animate={featInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
              >
                Platform Features
              </motion.span>
              <motion.h2
                style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--lp-text)", margin: 0, maxWidth: 380 }}
                initial={{ opacity: 0, y: 18 }}
                animate={featInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.1 }}
              >
                Everything in<br />One Place
              </motion.h2>
            </div>
            <motion.p
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: "var(--lp-ts)", maxWidth: 300, lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 14 }}
              animate={featInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 }}
            >
              Replacing scattered Google Forms and spreadsheets with a single, purpose-built system for Jnanaprabodhini&apos;s Jnana Pravas programme.
            </motion.p>
          </div>

          <div
            className="feat-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}
          >
            {[
              { bg: "rgba(74,85,190,.07)", color: "#4A55BE", icon: <Home size={22} strokeWidth={1.6} />, title: "Tour Management", desc: "Organise state visits with destinations, capacity, schedules, and applications all tracked in one place with full admin control." },
              { bg: "rgba(245,165,32,.08)", color: "#F5A520", icon: <ClipboardCheck size={22} strokeWidth={1.6} />, title: "Eligibility Tests", desc: "Online assessments to select the right students: MCQ, multi-select, and subjective, auto-graded with admin review for written answers." },
              { bg: "rgba(42,94,58,.08)", color: "#2A5E3A", icon: <Users size={22} strokeWidth={1.6} />, title: "Volunteer Tools", desc: "Daily reports, meeting logs, photo uploads, and cultural documentation — purpose-built for student volunteers on tour." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 36 }}
                animate={featInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.28 + i * 0.13, ease: [0.22, 0.68, 0, 1.2] }}
                style={{ perspective: 900 }}
              >
                <TiltCard
                  style={{ background: "white", border: "1px solid var(--lp-border)", borderRadius: 14, padding: "30px 26px", cursor: "default", height: "100%" }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 11, background: f.bg, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    {f.icon}
                  </div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16.5, fontWeight: 600, color: "var(--lp-text)", marginBottom: 10, letterSpacing: "-0.01em" }}>{f.title}</div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, color: "var(--lp-ts)", lineHeight: 1.72, margin: 0 }}>{f.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ background: "var(--lp-surface)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <motion.span
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Alumni Voices
            </motion.span>
            <motion.h2
              style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,50px)", fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--lp-text)", margin: "0 0 16px" }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.1 }}
            >
              What Our Alumni Say
            </motion.h2>
            <motion.p
              style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: "var(--lp-ts)", maxWidth: 520, margin: "0 auto 28px" }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.18 }}
            >
              Thousands of students have travelled across India with Gyan Setu. Here are their stories.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.26 }}
            >
              <Link
                href="/testimonial"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--lp-navy)", color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, padding: "11px 24px", borderRadius: 6, textDecoration: "none", letterSpacing: "0.02em" }}
              >
                Share Your Experience
                <ChevronRight size={15} />
              </Link>
            </motion.div>
          </div>

          {testimonials.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  style={{ background: "white", border: "1px solid var(--lp-border)", borderRadius: 14, padding: "26px 24px", display: "flex", flexDirection: "column", gap: 16 }}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.09, ease: [0.22, 0.68, 0, 1.2] }}
                >
                  <div style={{ color: "var(--lp-amber)", fontSize: 22, lineHeight: 1 }}>&ldquo;</div>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "var(--lp-ts)", lineHeight: 1.75, margin: 0, flex: 1 }}>
                    {t.message}
                  </p>
                  <div style={{ borderTop: "1px solid var(--lp-border)", paddingTop: 14 }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600, color: "var(--lp-text)" }}>{t.name}</div>
                    {(t.role || t.batch_year) && (
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "var(--lp-tm)", marginTop: 3 }}>
                        {[t.role, t.batch_year].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              style={{ textAlign: "center", padding: "40px 24px", background: "white", border: "1px solid var(--lp-border)", borderRadius: 14 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: "var(--lp-tm)", margin: 0 }}>
                Be the first to share your Gyan Setu experience.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── ALUMNI NETWORK ── */}
      <AlumniSection />

      {/* ── UPGRADE YOUR CAREER ── */}
      <section id="careers" style={{ background: "white", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "88px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }} className="career-grid">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
            >
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 14 }}>
                Opportunities
              </span>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--lp-text)", margin: "0 0 20px" }}>
                Upgrade Your Career<br />
                <span style={{ color: "var(--lp-navy)", fontStyle: "italic" }}>with Gyan Setu</span>
              </h2>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15.5, color: "var(--lp-ts)", lineHeight: 1.75, marginBottom: 28 }}>
                Gyan Setu is more than a tour programme — it&apos;s a launchpad. Join our growing team in education, science communication, research, and programme coordination. We&apos;re looking for passionate people ready to make a difference.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                {["Teaching & Education", "Science Communication", "Programme Coordination", "Research & Documentation"].map((role) => (
                  <div key={role} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(42,94,58,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#2A5E3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "var(--lp-ts)" }}>{role}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link
                  href="/careers"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--lp-green)", color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 26px", borderRadius: 6, textDecoration: "none" }}
                >
                  Apply Now <ChevronRight size={15} />
                </Link>
                <Link
                  href="/institution"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: "var(--lp-navy)", border: "1.5px solid var(--lp-navy)", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 26px", borderRadius: 6, textDecoration: "none" }}
                >
                  Apply as an Institution <ChevronRight size={15} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 0.68, 0, 1.2] }}
            >
              {[
                { num: "965+", label: "Volunteers trained", desc: "across India over multiple tour cohorts" },
                { num: "11",   label: "States covered",     desc: "giving team members diverse field experience" },
                { num: "100%", label: "Hands-on learning",  desc: "every role involves real community impact" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: 12, padding: "22px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 36, fontWeight: 700, color: "var(--lp-navy)", lineHeight: 1, flexShrink: 0 }}>{stat.num}</div>
                  <div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600, color: "var(--lp-text)", marginBottom: 4 }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "var(--lp-tm)" }}>{stat.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BE A SPONSOR ── */}
      <section style={{ background: "var(--lp-surface)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "88px 24px", textAlign: "center" }}>
          <motion.span
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--lp-amber)", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 14 }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Partnerships
          </motion.span>
          <motion.h2
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.022em", color: "var(--lp-text)", margin: "0 0 20px" }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            Be a Sponsor,{" "}
            <span style={{ color: "var(--lp-navy)", fontStyle: "italic" }}>Shape Young India</span>
          </motion.h2>
          <motion.p
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15.5, color: "var(--lp-ts)", lineHeight: 1.75, marginBottom: 32 }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            Your sponsorship powers science workshops in remote schools, supports volunteer travel, and helps bridge knowledge gaps across India. Partner with Gyan Setu and invest in a generation of curious, connected young minds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.26 }}
          >
            <Link
              href="/sponsor"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--lp-amber)", color: "white", fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 26px", borderRadius: 6, textDecoration: "none" }}
            >
              Become a Sponsor <ChevronRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ background: "var(--lp-navy)", padding: "88px 24px", position: "relative", overflow: "hidden" }}>
        <motion.div
          style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.035) 0%,transparent 70%)", top: "50%", left: "18%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{ position: "absolute", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(245,165,32,.07) 0%,transparent 70%)", top: "30%", right: "12%", pointerEvents: "none" }}
          animate={{ scale: [1, 1.35, 1], x: [0, -18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <motion.h2
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px,4.5vw,54px)", fontWeight: 600, color: "white", letterSpacing: "-0.022em", margin: "0 0 18px", lineHeight: 1.1 }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: [0.22, 0.68, 0, 1.2] }}
          >
            Ready to Explore India?
          </motion.h2>
          <motion.p
            style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15.5, color: "rgba(255,255,255,.58)", marginBottom: 42, lineHeight: 1.65 }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.14 }}
          >
            Create your account, apply for an upcoming Jnana Pravas, and take the eligibility test. Selected students travel across India as Jnanaprabodhini volunteers.
          </motion.p>
          <motion.div
            style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.26 }}
          >
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-white">Go to Dashboard</Link>
            ) : (
              <>
                <Link href="/sign-up" className="btn-white">Apply Now</Link>
                <Link href="/sign-in" className="btn-outline-white">Sign In</Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#19140F", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        {/* Main footer grid */}
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px 48px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }} className="footer-grid">
          {/* Brand column */}
          <div>
            <Image src="/logo_wide.png" alt="Gyan Setu" width={120} height={36} style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 18 }} />
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, color: "rgba(255,255,255,.45)", lineHeight: 1.75, maxWidth: 300, marginBottom: 24 }}>
              Jnanaprabodhini Educational Activity Research Centre. Building bridges of knowledge across India since 1962.
            </p>
            <div style={{ display: "flex", gap: 14 }}>
              {[
                { href: "https://www.facebook.com/share/19gufTtRBK/?mibextid=wwXIfr", label: "Facebook", hoverBg: "#1877F2", hoverColor: "white", path: "M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" },
                { href: "https://www.instagram.com/gyan_setu_?igsh=MTNzbHBxbmo3OXZiYQ==", label: "Instagram", hoverBg: "#E1306C", hoverColor: "white", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                { href: "https://www.linkedin.com/company/gyan-setu/", label: "LinkedIn", hoverBg: "#0A66C2", hoverColor: "white", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                { href: "https://youtube.com/@gyansetuyoutubechannel?si=Fc1wprxTfw55Rmnn", label: "YouTube", hoverBg: "#FF0000", hoverColor: "white", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
              ].map(({ href, label, hoverBg, hoverColor, path }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.5)", transition: "all .2s", flexShrink: 0 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = hoverBg; el.style.color = hoverColor; el.style.borderColor = hoverBg; el.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "rgba(255,255,255,.07)"; el.style.color = "rgba(255,255,255,.5)"; el.style.borderColor = "rgba(255,255,255,.1)"; el.style.transform = "translateY(0)"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Explore column */}
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Explore</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Gallery", href: "/gallery" },
                { label: "Visits", href: "/visits" },
                { label: "Blog", href: "/blog" },
                { label: "Newsletter", href: "/newsletter" },
                { label: "FAQ",        href: "/faq"        },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, color: "rgba(255,255,255,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.5)"; }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Get Involved column */}
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Get Involved</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Apply for a Tour", href: isLoggedIn ? "/dashboard" : "/sign-up" },
                { label: "Share Your Story", href: "/testimonial" },
                { label: "Be a Sponsor", href: "/sponsor" },
                { label: "Careers", href: "/careers" },
                { label: isLoggedIn ? "Dashboard" : "Sign In", href: isLoggedIn ? "/dashboard" : "/sign-in" },
              ].map(({ label, href }) => (
                <a key={label} href={href} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13.5, color: "rgba(255,255,255,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.5)"; }}
                >{label}</a>
              ))}
            </div>
          </div>

          {/* Contact column */}
          <div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Address</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,.5)", lineHeight: 1.65 }}>
                  Jnanaprabodhini EARC<br />
                  Sadashiv Peth, Pune<br />
                  Maharashtra, India
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, color: "rgba(255,255,255,.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Email</div>
                <a href="mailto:gyansetu@jnanaprabodhini.org" style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, color: "rgba(255,255,255,.5)", textDecoration: "none", transition: "color .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.5)"; }}
                >
                  gyansetu@jnanaprabodhini.org
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "20px 24px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <p suppressHydrationWarning style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,.28)", margin: 0 }}>
              © {new Date().getFullYear()} Jnanaprabodhini Educational Resource Centre. All rights reserved.
            </p>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "rgba(255,255,255,.28)", margin: 0 }}>
              Made by{" "}
              <a href="https://anahat-entertainment.vercel.app" target="_blank" rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,.45)", fontWeight: 600, textDecoration: "none", transition: "color .18s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.45)"; }}
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
