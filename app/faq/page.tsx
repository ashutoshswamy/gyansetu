"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  {
    id: "general",
    label: "General FAQs",
    items: [
      {
        q: 'What does "Gyan-Setu" mean?',
        a: '"Gyan-Setu" means "knowledge-bridge". This program aims at connecting remote and aspirational parts of India through knowledge exchange.',
      },
      {
        q: "What is the main theme of Gyan-Setu?",
        a: "Gyan-Setu is a volunteer program to conduct activity-based workshops for middle-school students in remote parts of aspirational and developmentally challenged states and UT of India.",
      },
      {
        q: "Why should I participate in this program?",
        a: "This program provides you a unique opportunity to contribute in spreading the joy of education among children and providing them exposure to the exciting world of science and math's. This process will in turn help you to have better understanding of the region and people from these remote areas; thus, facilitating development of a proactive attitude in you towards problems being faced by the society.",
      },
      {
        q: "Who organizes this program?",
        a: "This program is organized by Educational Activity Research Center (EARC), Jnana Prabodhini, Pune. Please visit the following link for more details about this organizer, https://earc.jnanaprabodhini.org/",
      },
      {
        q: "Which are the states where the program is planned?",
        a: "This program is planned in multiple states and Union territories of India viz. Arunachal Pradesh, Assam, Nagaland, Manipur, Chhattisgarh, Jharkhand, Orissa Meghalaya, Jammu-Kashmir and Ladakh.",
      },
      {
        q: "Why did you choose only these states?",
        a: "These states, and especially the specific regions within these states where Gyan-Setu workshops are being arranged, are one of the most under-developed and aspirational parts of India. Of course, we need to expand this program to all other parts of this country. We certainly plan to do so, slowly and steadily, through collaborations with various organizations.",
      },
      {
        q: "What if my organization is interested in collaborating in this project?",
        a: "Your organization would be most welcome to be a part of Gyan-Setu. As mentioned above, Gyan-Setu envisages building a strong and robust network of organizations to create a sustainable platform for this program. Please contact our office or write to us at gyansetu@jnanaprabodhini.org.",
      },
    ],
  },
  {
    id: "registration",
    label: "Volunteer Registration FAQs",
    items: [
      {
        q: "Who are you looking for?",
        a: "We are looking for enthusiastic, energetic and young-at-heart volunteers who would like to use their time, intellect and energy for the benefit of the society. There is no stringent requirement of education but prior experience of conducting activities (preferably educational) for children would be highly beneficial.",
      },
      {
        q: "Is there any age limit for participation as a volunteer?",
        a: "Volunteers should have age between 18 to 40 years. Others should contact the Gyan-Setu office prior to their registration.",
      },
      {
        q: "I do not have experience of any such activities nor do I have a science background. Can I still participate in Gyan-Setu?",
        a: "Yes, you can certainly register for Gyan-Setu. You will undergo orientation-cum-training workshop and also trial workshop i.e. demonstration before going on for Gyan-Setu visit. Although we will put all our efforts to prepare you in the best possible way, it is your responsibility to get acquainted with the activities to be conducted during the workshops. Hence, participation in the orientation-cum-training and trial workshops is compulsory.",
      },
      {
        q: "What all is expected from a registered Gyan-Setu volunteer?",
        a: "A registered Gyan-Setu volunteer is expected to participate in a Gyan-Setu visit to one of the states allocated by the Team. He/she will be a part of a team of 6-8 volunteers. After the completion of your visit, you can also help/mentor successive volunteer teams going to the same state.",
      },
      {
        q: "How can I register?",
        a: "Create your Gyan Setu account and complete your profile to register for the visit.",
      },
      {
        q: "What is the registration fee? How should I pay it?",
        a: "The registration fee is ₹500+GST. The fee can be paid online at least 3 days before the scheduled training.",
      },
      {
        q: "Can I have preferences for particular states of my choice?",
        a: "No. You will be allocated a state by the Gyan-Setu Team.",
      },
      {
        q: "When are visits to these states planned? Can I have preferences for dates, according to my schedule?",
        a: "There are specific visit periods for each state, based on local weather conditions and the availability of schools. Once you create your profile and complete the pre-test, you will be able to view the visit schedule, including the available dates for visit.",
      },
      {
        q: "What is the selection process for volunteers?",
        a: "The selection process is based on the successful completion of all required steps, attendance at all compulsory events (e.g., the 15 August Melawa, training sessions, and orientation), and performance in the interview.",
      },
      {
        q: "How will it be conveyed to me? Roughly when?",
        a: "Once you register on Gyan Setu, create your profile, and apply for a visit, all further communication and updates will be available on your Gyan Setu profile and will also be sent to your registered email address.",
      },
      {
        q: "What if I have to change/cancel my participation at previously selected duration due to some unforeseen circumstances?",
        a: "You can submit a cancellation request from your profile by providing a valid reason. Your request will be sent to the administrator, and you will receive an update within 2 working days.",
      },
    ],
  },
  {
    id: "preparation",
    label: "Volunteer Preparation FAQs",
    items: [
      {
        q: "I have applied for a Gyan-Setu visit (i.e., selected my visit dates). What next?",
        a: "After applying for a Gyan-Setu visit, every volunteer must complete the mandatory requirements on their individual profile before the visit. These include the Interview, Pre-Test, Orientation-cum-Training Workshop, and Trial/Demo Workshop. These activities will help you understand the workshop content, prepare for the visit, and provide all the necessary information related to your assigned visit.",
      },
      {
        q: "When and where will the orientation-cum-training workshop be arranged for me?",
        a: "Orientation-cum-training workshop is arranged mostly at Gyan-Setu office i.e. Jnana Prabodhini, 510, Sadashiv Peth, Pune-411030. Date, time and venue will be conveyed by email prior to one week by Gyan Setu team. Please keep checking the email and social media frequently. Hence, in most of the cases, you will be required to come at this address to participate in this workshop. Currently it must be noted that physical participation (and not online e.g. Zoom, google meet etc.) is mandatory in this workshop.",
      },
      {
        q: "What does orientation-cum-training session consist of?",
        a: "The goal of this workshop is to prepare volunteers as best as possible for the planned Gyan-Setu visit. This includes orientation to the content of Gyan-Setu workshops (e.g. science and math's toys, maps, activities) along with towards social conditions at the locations and relevance of this program there.",
      },
      {
        q: "Where can I get information about the content of Gyan-Setu workshops?",
        a: "You will be provided with a Gyan-Setu companion book. This contains fairly detailed illustration of all possible activities to be conducted in these workshops. You are encouraged to use this book to prepare yourself well.",
      },
      {
        q: "What are trial / demo workshops? When and where would I conduct these?",
        a: "You will be required to conduct trial / demo workshops at schools/places (mostly in rural area) near Pune (or your place of residence), along with your team with which you will be going for the Gyan-Setu visit. This is required so that you get more acquainted with the specific activities, required while conducting them with children etc. Gyan-Setu organizing team will arrange these workshops after your orientation-cum-training workshops.",
      },
      {
        q: "Is this much preparation enough for my Gyan-Setu visit?",
        a: "If you participate sincerely both in orientation-cum-training and trial workshops, you will be prepared quite well for the visit. However, it would be a good idea to perform as many trial workshops as possible, on your own, may be at places of your knowledge. This will add to your experience and confidence of conducting these activities. Moreover, it will also benefit the children where you will conduct these trial workshops. The Gyan-Setu organizing team will certainly help you in this.",
      },
    ],
  },
  {
    id: "visit",
    label: "Gyan-Setu Visit FAQs",
    items: [
      {
        q: "Who takes care of logistics of volunteer team at the respective states?",
        a: "As mentioned earlier, regional partner organizations take care of the logistics of volunteer teams at the locations of Gyan-Setu visits. The project coordinator from Gyan-Setu organizing team are also involved in coordinating all necessary logistical planning.",
      },
      {
        q: "What is the overall structure of a typical Gyan-Setu visit?",
        a: "A typical Gyan-Setu visit of around 15 days comprises 4-7 days of travel, 6 days of actual workshops and cultural program and 1-2 days of sight-seeing.",
      },
      {
        q: "How will our team get assistance to prepare our travel plan?",
        a: "Project coordinators will help your team to prepare a detailed travel plan, with assistance from the regional partner organizations. They will provide you all information regarding travel options (i.e. train, bus, flight etc.). However, you should finalize and book your travel plan (Train tickets) yourself and not rely completely on the coordinator.",
      },
      {
        q: "What are the expenses involved in the visit?",
        a: "Around ₹7,000/- per person. It may vary according to place-state and sightseeing planning after workshop by group.",
      },
      {
        q: "What if I can't bear the expenses? Can I get sponsorship from Gyan-Setu?",
        a: "Gyan-Setu does not offer sponsorship to volunteers.",
      },
      {
        q: "Whom should I coordinate with (from Gyan-Setu team) during the visit, in case of any problems?",
        a: "You and your accompanying team will coordinate with the State coordinator (of your respective state) from Gyan-Setu organizing team (or any other person appointed by him/her). You can contact him/her in case of any problems or difficulties.",
      },
      {
        q: "Any special precautions related to health?",
        a: "Please contact the coordinators to get detailed suggestions regarding health-related precautions.",
      },
    ],
  },
  {
    id: "sponsorship",
    label: "Sponsorship FAQs",
    items: [
      {
        q: "What if I need financial support for participation in Gyan-Setu visit? How can I apply for sponsorship?",
        a: "Sponsorship is not provided as a standard provision. However, in exceptional cases, you may discuss your situation with the Project Head. Any decision regarding financial support will be solely at the discretion of the Project Head.",
      },
    ],
  },
  {
    id: "donations",
    label: "Donations FAQs",
    items: [
      {
        q: "I'm not able to participate in this activity. Can I contribute in any other way?",
        a: "Yes, certainly! You can participate as a part of content development or publicity or sponsorship related work.",
      },
      {
        q: "What are the options for me to give donations to Gyan-Setu?",
        a: "You can Sponsor a Volunteer, which covers the expenses of one volunteer for a Gyan-Setu visit. The sponsorship amount is ₹7,000. You may also contribute by donating towards other program-related expenses. If you are interested in sponsoring a volunteer or making a donation, please contact our team to discuss the details further.",
      },
      {
        q: "Where will the donations be used?",
        a: "All donations will be used to provide sponsorship to volunteers, preparing kits for Gyan-Setu workshops and other operational costs (e.g. supplementary material, publicity etc.).",
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

function scrollByAmount(ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) {
  ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
}

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState("general");
  const active = categories.find((c) => c.id === activeTab)!;
  const tabsRef = useRef<HTMLDivElement>(null);

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
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              aria-label="Scroll tabs left"
              onClick={() => scrollByAmount(tabsRef, -1)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid #E4DFD1",
                background: "white",
                color: "#5A5247",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div
              ref={tabsRef}
              style={{ display: "flex", gap: 0, borderBottom: "none", overflowX: "auto", scrollBehavior: "smooth" }}
            >
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
            <button
              type="button"
              aria-label="Scroll tabs right"
              onClick={() => scrollByAmount(tabsRef, 1)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid #E4DFD1",
                background: "white",
                color: "#5A5247",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
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
