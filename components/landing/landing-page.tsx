"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HeroTicket } from "./hero-ticket";
import { landingFontVars } from "./landing-fonts";
import "./landing.css";

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

const NAV = [
  { label: "Our Story", href: "/#our-story" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Visits", href: "/visits" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
];

const STATS = [
  { val: "91,348", lbl: "Students Connected" },
  { val: "1,688", lbl: "Schools Reached" },
  { val: "13", lbl: "States & UT" },
  { val: "1,050", lbl: "Volunteers Engaged" },
];

const STATES = ["Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Jammu & Kashmir", "Jharkhand", "Ladakh", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Nagaland", "Odisha"];

const ACTIVITIES = [
  { plate: "Workshops", photo: 210, alt: "Children holding up cards during a workshop", desc: "Conduct joyful, hands-on science and mathematics workshops for middle school students" },
  { plate: "Network", photo: 88, alt: "Volunteers seated together at a heritage site in Assam", desc: "Build a network of volunteers, communities, and grassroots organizations to strengthen this “Knowledge Bridge”" },
  { plate: "Visits", photo: 3, alt: "A village gathering with volunteers in Chhattisgarh", desc: "Organize volunteer visits to remote, tribal, and aspirational regions of India to promote national integration through education and cultural exchange" },
];

const STORY_A = [
  "At Gyan-Setu, our journey began in 2013 with a visionary idea: to promote national integration through activity-based learning. We set out to bridge through education in India’s remote, tribal, and underserved regions, using science, mathematics and exhibition as a tool to connect, empower, and inspire.",
  "As an initiative of Jnana Prabodhini’s Educational Activity Research Centre (EARC), we have conducted hands-on science and mathematics workshops in schools across remote, aspirational and culturally diverse regions of the country, reaching communities with limited access to enriching educational opportunities. From Maharashtra, where Gyan-Setu began, to the tranquil hills of Arunachal Pradesh and Meghalaya, the vibrant cultures of Assam, Manipur, and Nagaland, and the diverse landscapes of Bihar, Chhattisgarh, Odisha, Jharkhand, and Madhya Pradesh, our efforts continue to reach communities across the country. From the remote schools of Ladakh and Jammu & Kashmir to the farthest corners of the Northeast, Gyan-Setu connects diverse regions, cultures, and communities through the shared pursuit of learning, national integration, and meaningful engagement.",
];
const STORY_B = [
  "Driven by the spirit of volunteerism, Gyan-Setu brings together passionate individuals mostly college students and young professionals from across India. Through language exchange, homestays, traditional meals, and shared experiences, they form lasting human bonds and develop a deep understanding of India’s social and cultural fabric.",
  "With the support of local partner organizations, we continue to build human bridges through knowledge exchange, nurturing curiosity, compassion, and confidence in young learners while transforming volunteers into socially responsible, culturally aware changemakers for the nation.",
  "As we grow, we invite you to join this movement. Together, let’s create a future where every child, no matter where they live, has access to joyful learning and a sense of belonging in a united India.",
];

const STEPS = [
  { title: "Register, Apply & Pre-Test", desc: "Create your Gyan-Setu profile, complete the registration form, apply for a tour, and take the pre-test to begin your volunteer journey and attending the annual event (15 August Melawa and 26 January Katta)" },
  { title: "Orientation & Training", desc: "Attend the mandatory orientation, training sessions, and demo workshops to understand Gyan-Setu's mission, educational activities, and volunteer responsibilities" },
  { title: "Selection & Team Formation", desc: "Complete the interview and selection process. Selected volunteers are grouped into teams and assigned a state based on programme requirements" },
  { title: "Preparation & State Study", desc: "Prepare with your team by planning activities, coordinating logistics, and studying the history, culture, geography, language, and local context of your allotted state" },
  { title: "School & Community Visit", desc: "Travel to the assigned region to conduct science and mathematics workshops, career guidance sessions, the “Know Our Country” Exhibition, and engage in cultural understanding with schools and local communities" },
  { title: "Reflection & Continued Engagement", desc: "Submit reports and post-test feedback, receive your certificate of participation at Gyan-Setu events (15 August Melawa and 26 January Katta), and continue as an active member of the Gyan-Setu volunteer network" },
];

const SOCIAL = [
  { href: "https://www.facebook.com/share/19gufTtRBK/?mibextid=wwXIfr", label: "Facebook", path: "M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" },
  { href: "https://www.instagram.com/gyan_setu_?igsh=MTNzbHBxbmo3OXZiYQ==", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  { href: "https://www.linkedin.com/in/gyan-setu-792023211", label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { href: "https://youtube.com/@gyansetuyoutubechannel?si=Fc1wprxTfw55Rmnn", label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
];

/* Photo window: posts are photo-on-top with a caption band, so crop to the photo. */
function Photo({ n, alt, sizes, className }: { n: number; alt: string; sizes: string; className: string }) {
  return (
    <div className={className}>
      <Image src={`/posts/${n}.png`} alt={alt} fill sizes={sizes} />
    </div>
  );
}

function Nav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="gl-nav" aria-label="Main">
        <div className="gl-nav-in">
          <Link href="/" className="gl-logo" aria-label="Gyan-Setu home">
            <Image src="/logo_wide.png" alt="Gyan-Setu" width={135} height={40} priority />
          </Link>
          <div className="gl-links">
            {NAV.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
          </div>
          <div className="gl-nav-cta">
            {signedIn ? (
              <Link href="/dashboard" className="gl-btn gl-btn-yellow">Go to Home</Link>
            ) : (
              <>
                <Link href="/sign-in" className="gl-signin">Sign In</Link>
                <Link href="/sign-up" className="gl-btn gl-btn-yellow">Get Started</Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="gl-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="gl-drawer"
            onClick={() => setOpen((v) => !v)}
          >
            <HugeiconsIcon icon={open ? Cancel01Icon : Menu01Icon} size={22} strokeWidth={2} />
          </button>
        </div>
      </nav>
      <div id="gl-drawer" className={`gl-drawer${open ? " is-open" : ""}`}>
        {NAV.map((l) => <a key={l.label} className="gl-dl" href={l.href} onClick={() => setOpen(false)}>{l.label}</a>)}
        <div className="gl-hero-cta">
          {signedIn ? (
            <Link href="/dashboard" className="gl-btn gl-btn-yellow" onClick={() => setOpen(false)}>Go to Home</Link>
          ) : (
            <>
              <Link href="/sign-up" className="gl-btn gl-btn-yellow" onClick={() => setOpen(false)}>Get Started</Link>
              <Link href="/sign-in" className="gl-btn gl-btn-ghost" onClick={() => setOpen(false)}>Sign In</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Slip({ t }: { t: Testimonial }) {
  const long = t.message.length > 260;
  const [open, setOpen] = useState(false);
  return (
    <figure className="gl-slip">
      <blockquote className={long && !open ? "is-clamped" : undefined}>{t.message}</blockquote>
      {long && (
        <button type="button" className="gl-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "Show less" : "Read more"}
        </button>
      )}
      <footer>
        <b>{t.name}</b>
        {(t.role || t.batch_year) && <span>{[t.role, t.batch_year].filter(Boolean).join(", ")}</span>}
      </footer>
    </figure>
  );
}

const rise = (reduce: boolean | null, delay = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
      };

export function LandingPage({ testimonials = [] }: LandingPageProps) {
  const { isSignedIn } = useAuth();
  const signedIn = !!isSignedIn;
  const reduce = useReducedMotion();
  const storyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start 0.7", "end 0.5"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const applyHref = signedIn ? "/dashboard" : "/sign-up";

  return (
    <main className={`gl ${landingFontVars}`}>
      <Nav signedIn={signedIn} />

      {/* ── HERO ── */}
      <section className="gl-hero" aria-labelledby="gl-h1">
        <div className="gl-hero-grid">
          <div className="gl-hero-copy">
            <motion.h1
              id="gl-h1"
              className="gl-h1"
              {...(reduce ? {} : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } })}
            >
              Gyan-Setu
            </motion.h1>
            <p className="gl-hero-dev" lang="mr">ज्ञान सेतू, a bridge of knowledge</p>
            <p className="gl-lede">
              A year-long volunteer journey of hands-on science, learning and service across remote India, run by Jnana Prabodhini EARC.
            </p>
            <div className="gl-hero-cta">
              <Link href={applyHref} className="gl-btn gl-btn-yellow">
                {signedIn ? "Go to Home" : "Apply for a Visit"}
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2.4} />
              </Link>
              <a href="#how-it-works" className="gl-btn gl-btn-ghost">Learn More</a>
            </div>
          </div>
          <HeroTicket />
        </div>
        <div className="gl-rails" aria-hidden="true" />
      </section>

      {/* ── FARE STRIP: real numbers ── */}
      <section className="gl-fare" aria-label="Gyan-Setu in numbers">
        <div className="gl-fare-in">
          {STATS.map((s) => (
            <div key={s.lbl} className="gl-fare-cell">
              <b>{s.val}</b>
              <span>{s.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="gl-section" aria-labelledby="gl-what">
        <div className="gl-wrap">
          <div className="gl-what-head">
            <motion.h2 id="gl-what" className="gl-h2" {...rise(reduce)}>What We Do</motion.h2>
            <motion.p className="gl-lede" {...rise(reduce, 0.08)}>
              Gyan-Setu is a year-long volunteer initiative by Jnana Prabodhini&apos;s Educational Activity Research Centre (EARC). Volunteers conduct joyful, hands-on science and mathematics workshops, along with career guidance sessions and the &ldquo;Know Our Country&rdquo; Exhibition, in remote, tribal, and aspirational regions across India. The programme fosters scientific curiosity, knowledge exchange, cultural understanding, and national integration.
            </motion.p>
          </div>
          <div className="gl-what-grid">
            {ACTIVITIES.map((a, k) => (
              <motion.div key={a.plate} className="gl-coach" {...rise(reduce, k * 0.1)}>
                <Photo n={a.photo} alt={a.alt} sizes="(max-width: 900px) 92vw, 400px" className="gl-coach-photo" />
                <span className="gl-plate">{a.plate}</span>
                <p>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section id="our-story" className="gl-section gl-bg-deep" aria-labelledby="gl-story">
        <div className="gl-wrap">
          <div ref={storyRef} className="gl-story">
            <div className="gl-story-side">
              <h2 id="gl-story" className="gl-h2">Since 2013</h2>
              <p className="gl-route-title">Where we&apos;ve worked: 13 States &amp; UTs</p>
              <ol className="gl-route">
                {!reduce && <motion.div className="gl-route-fill" style={{ scaleY: fill }} aria-hidden="true" />}
                {STATES.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>

            <div className="gl-notice">
              {STORY_A.map((p, i) => <p key={i}>{p}</p>)}
              <Photo n={170} alt="Students filling a school hall in Mon, Nagaland for a Gyan-Setu workshop" sizes="(max-width: 900px) 90vw, 640px" className="gl-inset gl-inset-wide" />
              <p className="gl-pull">Volunteers not only teach, but also learn, live, and grow with the communities they serve.</p>
              {STORY_B.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="gl-section" aria-labelledby="gl-how">
        <div className="gl-wrap">
          <div className="gl-how-head">
            <motion.h2 id="gl-how" className="gl-h2" {...rise(reduce)}>How It Works</motion.h2>
          </div>
          <ol className="gl-table">
            {STEPS.map((s, i) => (
              <motion.li key={s.title} className="gl-row" {...rise(reduce, 0.04)}>
                <span className="gl-stop" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="gl-section gl-bg-deep" aria-labelledby="gl-voices">
        <div className="gl-wrap">
          <div className="gl-voices-head">
            <div>
              <motion.h2 id="gl-voices" className="gl-h2" {...rise(reduce)}>What Our Alumni Say</motion.h2>
              <p className="gl-lede">Thousands of volunteers have travelled across India with Gyan-Setu. Here are their stories.</p>
            </div>
            <Link href="/testimonial" className="gl-btn gl-btn-yellow">
              Share Your Experience
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2.4} />
            </Link>
          </div>
          {testimonials.length > 0 ? (
            <div className="gl-slips-wrap">
              <div className="gl-slips">
                {testimonials.map((t) => <Slip key={t.id} t={t} />)}
              </div>
            </div>
          ) : (
            <p className="gl-empty">Be the first to share your Gyan Setu experience.</p>
          )}
        </div>
      </section>

      {/* ── ALUMNI NETWORK ── */}
      <section id="alumni" className="gl-section" aria-labelledby="gl-alumni">
        <div className="gl-wrap">
          <motion.div className="gl-pass" {...rise(reduce)}>
            <div className="gl-pass-main">
              <h2 id="gl-alumni" className="gl-h2">Your Journey <em>Doesn&apos;t End Here</em></h2>
              <p>Your Gyan-Setu journey doesn&apos;t end with a visit. Join our alumni network to reconnect, share your experiences, and inspire the next generation of volunteers.</p>
              <Link href="/alumni" className="gl-btn gl-btn-stock">
                Register as Alumni
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="gl-pass-stub">
              <q>Once a Gyan-Setu Volunteer, Always One</q>
              <span>Reconnect. Share your story. Guide the next generation.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INSTITUTIONS ── */}
      <section id="institutions" className="gl-section gl-bg-night" aria-labelledby="gl-inst">
        <div className="gl-wrap">
          <div className="gl-inst-head">
            <motion.h2 id="gl-inst" className="gl-h2" {...rise(reduce)}>Collaborate with Gyan-Setu</motion.h2>
            <p>Collaborate to create engaging learning experiences for your students. Together, we can inspire scientific curiosity, cultural understanding, and a spirit of national integration.</p>
          </div>
          <div className="gl-plates">
            {["Science & Mathematics Workshops", "Career Guidance Sessions", "“Know Our Country” Exhibition"].map((t, k) => (
              <motion.div key={t} className="gl-sign" {...rise(reduce, k * 0.1)}>
                <h3 className="gl-h3">{t}</h3>
              </motion.div>
            ))}
          </div>
          <Link href="/institution" className="gl-btn gl-btn-yellow">
            Apply as Institution
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2.4} />
          </Link>
        </div>
      </section>

      {/* ── SPONSOR ── */}
      <section className="gl-section gl-yellow" aria-labelledby="gl-sponsor">
        <div className="gl-wrap">
          <div className="gl-sponsor">
            <div>
              <motion.h2 id="gl-sponsor" className="gl-h2" {...rise(reduce)}>Be a Sponsor, Shape Young India</motion.h2>
              <p>Your sponsorship powers activity-based learning workshops in remote schools, supports volunteer travel, and helps bridge knowledge gaps across India. Partner with Gyan-Setu and invest in a generation of curious, connected young minds.</p>
              <Link href="/sponsor" className="gl-btn gl-btn-ink">
                Become a Sponsor
                <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="gl-sponsor-stats">
              <div><b>1,688</b><span>Schools Reached</span></div>
              <div><b>13</b><span>States &amp; UT</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="gl-section gl-bg-deep gl-final" aria-labelledby="gl-final">
        <div className="gl-wrap">
          <motion.h2 id="gl-final" className="gl-h2" {...rise(reduce)}>Ready to Explore India?</motion.h2>
          <p className="gl-lede">Create your account, apply for an upcoming Gyan-Setu Visit, and take the eligibility test. Selected volunteers travel across India as Gyan-Setu, EARC Jnana Prabodhini volunteers.</p>
          <div className="gl-hero-cta">
            {signedIn ? (
              <Link href="/dashboard" className="gl-btn gl-btn-yellow">Go to Home</Link>
            ) : (
              <>
                <Link href="/sign-up" className="gl-btn gl-btn-yellow">Apply Now</Link>
                <Link href="/sign-in" className="gl-btn gl-btn-ghost">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="gl-foot">
        <div className="gl-wrap">
          <div className="gl-foot-grid">
            <div>
              <span className="gl-foot-logo"><Image src="/logo_wide.png" alt="Gyan-Setu" width={120} height={36} /></span>
              <p style={{ maxWidth: "34ch", margin: 0 }}>Jnana Prabodhini Educational Activity Research Centre. Building bridges of knowledge across India since 2013.</p>
              <div className="gl-social">
                {SOCIAL.map(({ href, label, path }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={path} /></svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                {[["How It Works", "#how-it-works"], ["Gallery", "/gallery"], ["Visits", "/visits"], ["Blog", "/blog"], ["Newsletter", "/newsletter"], ["FAQ", "/faq"]].map(([l, h]) => (
                  <li key={l}><a href={h}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Get Involved</h4>
              <ul>
                {[
                  ["Apply for a Tour", applyHref],
                  ["Register as Alumni", "/alumni"],
                  ["Share Your Story", "/testimonial"],
                  ["Be a Sponsor", "/sponsor"],
                  [signedIn ? "Home" : "Sign In", signedIn ? "/dashboard" : "/sign-in"],
                ].map(([l, h]) => (
                  <li key={l}><a href={h}>{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <address>
                <a href="https://goo.gl/maps/XptGcSa9XG8C7aFq7" target="_blank" rel="noopener noreferrer">
                  510, 1st Floor EARC<br />Jnana Prabodhini, Sadashiv Peth<br />Pune - 411030
                </a>
                <span>020-24207139</span>
                <a href="mailto:gyansetu@jnanaprabodhini.org">gyansetu@jnanaprabodhini.org</a>
                <span>
                  <a href="https://earc.jnanaprabodhini.org/" target="_blank" rel="noopener noreferrer">EARC</a>
                  {" and "}
                  <a href="https://www.jnanaprabodhini.org/" target="_blank" rel="noopener noreferrer">Jnana Prabodhini</a>
                </span>
              </address>
            </div>
          </div>
          <div className="gl-foot-bar">
            <span>© 2026 Jnana Prabodhini Educational Activity Research Centre. All rights reserved.</span>
            <span>
              Made by{" "}
              <a href="https://anahat-entertainment.vercel.app" target="_blank" rel="noopener noreferrer"><b>Anahat Entertainment</b></a>
            </span>
          </div>
        </div>
        <div className="gl-wordmark" aria-hidden="true">gyan<b>setu</b></div>
      </footer>
    </main>
  );
}
