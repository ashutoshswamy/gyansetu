"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

const categories = [
  {
    id: "general",
    label: "General FAQs",
    items: [
      {
        q: 'What does "Gyan Setu" mean?',
        a: '"Gyan Setu" means "knowledge-bridge". This program aims at connecting remote parts of India through knowledge exchange.',
      },
      {
        q: "What is the main theme of Gyan Setu?",
        a: "Gyan Setu is a volunteer program to conduct science-based workshops for middle-school students in remote parts of developmentally challenged states of India.",
      },
      {
        q: "Who organizes this program?",
        a: "This program is organized by the Educational Activity Research Centre (EARC), Jnanaprabodhini, Pune. Visit jnanaprabodhini.org for more details.",
      },
      {
        q: "Which states are covered by the program?",
        a: "The program covers Assam, Meghalaya, Nagaland, Arunachal Pradesh, Manipur, Odisha, Jharkhand, Chhattisgarh, Bihar, Jammu & Kashmir, and Ladakh — among the most under-served regions in India.",
      },
      {
        q: "Why were these states chosen?",
        a: "These states, and especially the specific regions within them where Gyan Setu workshops are conducted, are among the most under-developed parts of India. The program aims to expand steadily to all developmentally challenged parts of the country through collaborations with various organisations.",
      },
      {
        q: "What if my organisation is interested in collaborating?",
        a: "Your organisation is most welcome to be a part of Gyan Setu. We envision building a strong network of organisations to create a sustainable platform for this program. Please contact our office or write to us at gyansetu@jnanaprabodhini.org.",
      },
    ],
  },
  {
    id: "registration",
    label: "Volunteer Registration FAQs",
    items: [
      {
        q: "Who can register as a volunteer?",
        a: "Students who have completed or are currently enrolled in higher secondary education can register. Candidates should be motivated, responsible, and willing to work in remote areas for the duration of the visit.",
      },
      {
        q: "How do I apply?",
        a: "Create an account on this platform, navigate to the open tours section, and submit your application. You will then be prompted to complete an eligibility test.",
      },
      {
        q: "Is there an eligibility test?",
        a: "Yes. All applicants are required to take an online eligibility test covering general knowledge, science, and aptitude. Shortlisted candidates are selected based on their test performance and profile.",
      },
      {
        q: "When will I know if I am selected?",
        a: "Selected candidates will be notified through this platform and via email. Check your dashboard regularly for updates on your application status.",
      },
      {
        q: "Is there a registration fee?",
        a: "There is no registration fee to apply. Any fees related to the programme (travel, accommodation) will be communicated after selection.",
      },
    ],
  },
  {
    id: "preparation",
    label: "Volunteer Preparation FAQs",
    items: [
      {
        q: "What training do volunteers receive before the visit?",
        a: "Selected volunteers attend a one-day training workshop where they are introduced to the programme structure, workshop content, teaching methodologies, and expectations for conduct during the visit.",
      },
      {
        q: "Will I be given materials for the workshops?",
        a: "Yes. All necessary workshop materials, activity kits, and documentation templates are provided by the organisation. Volunteers are trained on how to use them effectively.",
      },
      {
        q: "What is the group structure during visits?",
        a: "Volunteers are divided into small groups, each allocated to a specific region or school. Each group has a group leader responsible for coordinating activities and daily reporting.",
      },
      {
        q: "What should I pack for the visit?",
        a: "A detailed packing and preparation guide is shared with selected volunteers after confirmation. It covers essentials for the specific region you are allocated to.",
      },
    ],
  },
  {
    id: "visit",
    label: "Gyan Setu Visit FAQs",
    items: [
      {
        q: "How long does a Gyan Setu visit last?",
        a: "A typical Jnana Pravas visit lasts 10–14 days depending on the destination and programme schedule for that cohort.",
      },
      {
        q: "What activities are conducted during the visit?",
        a: "Volunteers conduct science and activity-based workshops in local schools, interact with community members, document their experiences, and submit daily logs through this platform.",
      },
      {
        q: "Is accommodation and travel arranged by the organisation?",
        a: "Travel and accommodation arrangements are coordinated centrally. Details specific to your group and destination are shared after selection and group formation.",
      },
      {
        q: "What do I do if I face an issue during the visit?",
        a: "Each group has a designated contact person from the core team. Volunteers can also reach the central coordination office via email or phone numbers shared in the volunteer briefing pack.",
      },
      {
        q: "Will I receive a certificate after the visit?",
        a: "Yes. Volunteers who successfully complete the visit and submit their reports receive a certificate of participation from Jnanaprabodhini EARC.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: "1px solid #E4DFD1", paddingBottom: 0 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "22px 0",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 15,
            fontWeight: 500,
            color: open ? "#1E3A5F" : "#19140F",
            lineHeight: 1.5,
            transition: "color .2s",
          }}
        >
          {q}
        </span>
        <span style={{ flexShrink: 0, marginTop: 2, color: open ? "#1E3A5F" : "#9B9188" }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 14.5,
            color: "#5A5247",
            lineHeight: 1.8,
            paddingBottom: 22,
            margin: 0,
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState("general");
  const active = categories.find((c) => c.id === activeTab)!;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #E4DFD1", padding: "48px 24px 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Poppins',sans-serif", fontSize: 12, color: "#9B9188", textDecoration: "none", marginBottom: 24 }}
          >
            ← Back to Home
          </Link>
          <h1
            style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 700,
              color: "#19140F",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: "0 0 8px",
            }}
          >
            Frequently Asked Questions
          </h1>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15, color: "#8A7F76", marginBottom: 32 }}>
            Everything you need to know about Gyan Setu.
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "none", overflowX: "auto" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  fontFamily: "'Poppins',sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: activeTab === cat.id ? "#1E3A5F" : "#9B9188",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === cat.id ? "2px solid #1E3A5F" : "2px solid transparent",
                  padding: "10px 20px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color .2s, border-color .2s",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: "white", border: "1px solid #E4DFD1", borderRadius: 14, padding: "0 32px" }}>
          {active.items.map((item, i) => (
            <AccordionItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, color: "#9B9188" }}>
            Still have questions?{" "}
            <a
              href="mailto:gyansetu@jnanaprabodhini.org"
              style={{ color: "#1E3A5F", fontWeight: 600, textDecoration: "none" }}
            >
              Email us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
