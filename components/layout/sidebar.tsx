"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import type { UserRole } from "@/types";
import { createClientClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/features/notifications/notification-bell";
import {
  LayoutDashboard,
  Plane,
  ClipboardList,
  FileText,
  Users,
  UserCheck,
  BarChart2,
  CheckSquare,
  ChevronRight,
  Calendar,
  UsersRound,
  BookOpen,
  Award,
  Image,
  UserCircle,
  Images,
  MapPin,
  Newspaper,
  Rss,
  MessageSquare,
  Handshake,
  GraduationCap,
  Wallet,
  IdCard,
  Package,
  Home,
  Train,
  ClipboardCheck,
  FileBarChart,
  Receipt,
  Menu,
  X,
  KeyRound,
  Landmark,
  School,
  LogOut,
  Radio,
  Globe,
  HelpCircle,
} from "lucide-react";

type NavItem = { label: string; href: string; Icon: React.ElementType; description: string };
type NavGroup = { label: string; items: NavItem[] };

const adminGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Home", href: "/admin", Icon: LayoutDashboard, description: "Dashboard snapshot of tours, enrollments, and pending actions across the programme." },
      { label: "Analytics", href: "/admin/analytics", Icon: BarChart2, description: "Aggregate charts and trends across tours, volunteers, and enrollments." },
    ],
  },
  {
    label: "Tours & Travel",
    items: [
      { label: "Tours",     href: "/admin/tours",     Icon: Plane, description: "Create and manage tours — destination, dates, capacity, and status." },
      { label: "Visits",    href: "/admin/visits",    Icon: MapPin, description: "Manage public-facing visit listings shown on the website." },
      { label: "Groups",    href: "/admin/groups",    Icon: UsersRound, description: "Organize volunteers into state-wise teams within a tour; assign mentors." },
      { label: "Volunteer Locations", href: "/admin/locations", Icon: Radio, description: "Live map of volunteer-reported locations during an active tour." },
      { label: "Events",    href: "/admin/events",    Icon: Calendar, description: "Manage Katta, Melawa, trainings and other events; track RSVPs." },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Enrollments",      href: "/admin/students",   Icon: UserCheck, description: "Review tour applications and move enrollees through shortlist/selection." },
      { label: "Volunteers",       href: "/admin/volunteers", Icon: Users, description: "Directory of active volunteers and their assignment details." },
      { label: "Profile Data",     href: "/admin/profiles",   Icon: UserCircle, description: "Full volunteer profile records — contact, education, emergency info." },
    ],
  },
  {
    label: "Assessment",
    items: [
      { label: "Tests", href: "/admin/tests", Icon: ClipboardList, description: "Build eligibility tests, grade subjective answers, approve/reject results." },
      { label: "Forms", href: "/admin/forms", Icon: FileText, description: "Create custom forms for enrollees/volunteers and review submissions." },
      { label: "Demo Evaluations", href: "/admin/demo-evaluations", Icon: ClipboardCheck, description: "Score volunteers' practice teaching demos before a tour." },
    ],
  },
  {
    label: "Volunteer Journey",
    items: [
      { label: "Registration Fees", href: "/admin/registration-fees", Icon: Wallet, description: "Track who has paid the volunteer registration fee." },
      { label: "Workshops",         href: "/admin/workshops",         Icon: GraduationCap, description: "Schedule training workshops and review volunteer attendance." },
      { label: "ID Cards",          href: "/admin/id-cards",          Icon: IdCard, description: "Issue and print volunteer identity cards for a tour/group." },
      { label: "Local Hosts",       href: "/admin/local-hosts",       Icon: Home, description: "Directory of local contacts/hosts supporting a tour on the ground." },
      { label: "Kit Assembly",      href: "/admin/kits",              Icon: Package, description: "Track packing and distribution of teaching kits per group." },
      { label: "Travel & Tickets",  href: "/admin/travel",            Icon: Train, description: "Manage travel tickets per group — confirm bookings, approve itineraries." },
      { label: "Finance",           href: "/admin/finance",           Icon: Receipt, description: "Review and approve volunteer expense claims and advances." },
      { label: "Daily Logs",        href: "/admin/daily-logs",        Icon: BookOpen, description: "Read volunteers' daily reflection logs submitted during a tour." },
      { label: "Tour Reports",      href: "/admin/tour-reports",      Icon: FileBarChart, description: "Per-location reports on hosts, logistics, and observations after a visit." },
      { label: "School Reports",    href: "/admin/school-reports",    Icon: School, description: "School-visit reports filed by volunteers, browsable by tour and group." },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Gallery",    href: "/admin/gallery",    Icon: Images, description: "Manage photo gallery categories and images shown on the website." },
      { label: "Media",      href: "/admin/media",      Icon: Image, description: "Uploaded media library shared across the app." },
      { label: "Blog",       href: "/admin/blog",       Icon: Rss, description: "Write and publish blog posts to the public site." },
      { label: "Newsletter", href: "/admin/newsletter", Icon: Newspaper, description: "Upload and publish newsletter issues." },
    ],
  },
  {
    label: "Awards",
    items: [
      { label: "Certificates", href: "/admin/certificates", Icon: Award, description: "Generate participation/leadership certificates for volunteers." },
    ],
  },
  {
    label: "Outreach",
    items: [
      { label: "Testimonials", href: "/admin/testimonials", Icon: MessageSquare, description: "Manage volunteer/alumni testimonials shown on the website." },
      { label: "Sponsors",     href: "/admin/sponsors",     Icon: Handshake, description: "Review sponsorship inquiries submitted through the public site." },
      { label: "Alumni",       href: "/admin/alumni",       Icon: GraduationCap, description: "Directory of alumni registrations and their tour history." },
      { label: "Institutions", href: "/admin/institutions", Icon: Landmark, description: "Review partnership inquiries from schools and institutions." },
    ],
  },
];

const superAdminGroup: NavGroup = {
  label: "Super Admin",
  items: [
    { label: "Role Assignment", href: "/admin/super-admin", Icon: KeyRound, description: "Promote or change any user's role — the highest level of access control." },
  ],
};

const earcNavItems: NavItem[] = [
  { label: "Dashboard",       href: "/earc/dashboard",       Icon: LayoutDashboard, description: "Charts and KPIs across all submitted school and student data." },
  { label: "School Profile",  href: "/earc/school-profile",  Icon: School, description: "Collect standardized school-visit data for EARC projects — location, sessions, student strength." },
  { label: "Student Profile", href: "/earc/student-profile", Icon: GraduationCap, description: "Collect individual student records — name, DOB, gender, and identifiers." },
];

const earcPanelGroup: NavGroup = {
  label: "EARC Panel",
  items: [
    ...earcNavItems,
    { label: "Role Management", href: "/earc/roles", Icon: KeyRound, description: "Grant or revoke EARC staff access for a user." },
  ],
};

const coreMemberNavItems: NavItem[] = [
  { label: "Dashboard", href: "/core-member/dashboard", Icon: LayoutDashboard, description: "Your current visit and group, the volunteers in it, and your past group assignments." },
];

const flatNavItems: Record<"enrollee" | "volunteer", NavItem[]> = {
  enrollee: [
    { label: "Home",       href: "/enrollee",         Icon: LayoutDashboard, description: "Your enrollee dashboard — application status and next steps at a glance." },
    { label: "My Profile", href: "/enrollee/profile", Icon: UserCircle, description: "Fill in your personal, education, and emergency-contact details. Required before applying to tours." },
    { label: "Open Tours", href: "/enrollee/tours",   Icon: Plane, description: "Browse open tours and apply. You must be 18+ with a complete profile." },
    { label: "My Tests",   href: "/enrollee/tests",   Icon: ClipboardList, description: "Take the eligibility test for a tour you've applied to. Passing sends you for admin approval." },
    { label: "My Forms",   href: "/enrollee/forms",   Icon: FileText, description: "Any additional forms an admin has assigned you to fill out." },
  ],
  volunteer: [
    { label: "Home",          href: "/volunteer",              Icon: LayoutDashboard, description: "Your volunteer dashboard — tour assignments, pending forms, and test history." },
    { label: "My Profile",    href: "/volunteer/profile",      Icon: UserCircle, description: "Your full volunteer record — contact, address, education, work, and emergency info." },
    { label: "My Tours",      href: "/volunteer/tours",        Icon: Plane, description: "Tours you're assigned to, with dates and destination details." },
    { label: "Registration Fee", href: "/volunteer/registration-fee", Icon: Wallet, description: "Check whether your volunteer registration fee has been recorded as paid." },
    { label: "Tasks & Forms", href: "/volunteer/forms",        Icon: CheckSquare, description: "Complete forms assigned to you by an admin." },
    { label: "Workshops",     href: "/volunteer/workshops",    Icon: GraduationCap, description: "See scheduled training workshops and mark your attendance (RSVP before, attended/not after)." },
    { label: "Events",        href: "/volunteer/events",       Icon: Calendar, description: "Katta, Melawa and other events — RSVP as attending, not attending, or maybe." },
    { label: "My Group",      href: "/volunteer/groups",       Icon: UsersRound, description: "Your assigned tour group, teammates, and group leader/role." },
    { label: "Demo Evaluation", href: "/volunteer/demo-evaluations", Icon: ClipboardCheck, description: "View your practice-teaching demo scores and readiness feedback." },
    { label: "Daily Log",     href: "/volunteer/daily-log",    Icon: BookOpen, description: "Submit a short daily reflection log during an active tour (min. 50 words per question)." },
    { label: "School Details", href: "/volunteer/school-reports", Icon: School, description: "Fill a report for each school visited — details, sessions conducted, and reflections." },
    { label: "Travel",        href: "/volunteer/travel",       Icon: Train, description: "View your group's train tickets and post live location/travel updates." },
    { label: "Location",      href: "/volunteer/location",     Icon: Radio, description: "Share your current location with admins during a tour." },
    { label: "Expenses",      href: "/volunteer/expenses",     Icon: Wallet, description: "Submit bills for reimbursement and track their approval status." },
    { label: "Tour Report",   href: "/volunteer/tour-report",  Icon: FileBarChart, description: "File a detailed report per location visited — hosts, logistics ratings, observations." },
    { label: "Media",         href: "/volunteer/media",        Icon: Image, description: "Upload photos/videos from the tour to the shared media library." },
    { label: "Certificates",  href: "/volunteer/certificates", Icon: Award, description: "Download certificates issued to you for completed tours." },
    { label: "ID Card",       href: "/volunteer/id-card",      Icon: IdCard, description: "View and download your volunteer identity card." },
  ],
};

type SidebarRole = UserRole | "enrollee";

const roleConfig: Record<
  SidebarRole,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  admin: {
    label: "Administrator",
    dotColor: "#4A55BE",
    bgColor: "rgba(74,85,190,0.08)",
    textColor: "#4A55BE",
  },
  enrollee: {
    label: "Enrollee",
    dotColor: "#1E5A8A",
    bgColor: "rgba(30,90,138,0.08)",
    textColor: "#1E5A8A",
  },
  volunteer: {
    label: "Volunteer",
    dotColor: "#2A5E3A",
    bgColor: "rgba(42,94,58,0.08)",
    textColor: "#2A5E3A",
  },
  earc_staff: {
    label: "EARC Staff",
    dotColor: "#B8381E",
    bgColor: "rgba(184,56,30,0.08)",
    textColor: "#B8381E",
  },
  group_core_member: {
    label: "Core Member",
    dotColor: "#0E7C86",
    bgColor: "rgba(14,124,134,0.08)",
    textColor: "#0E7C86",
  },
  super_admin: {
    label: "Super Admin",
    dotColor: "#8A2BE2",
    bgColor: "rgba(138,43,226,0.08)",
    textColor: "#8A2BE2",
  },
};

const iconAccentColor: Record<SidebarRole, string> = {
  admin: "#4A55BE",
  enrollee: "#1E5A8A",
  volunteer: "#2A5E3A",
  earc_staff: "#B8381E",
  group_core_member: "#0E7C86",
  super_admin: "#8A2BE2",
};

function isItemActive(href: string, pathname: string) {
  const isExact = pathname === href;
  const isNested = href.split("/").length > 2 && pathname.startsWith(href + "/");
  return isExact || isNested;
}

function NavLink({
  item,
  accentColor,
  pathname,
}: {
  item: NavItem;
  accentColor: string;
  pathname: string;
}) {
  const active = isItemActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className="sb-navlink flex items-center justify-between px-3 py-[7px] rounded text-sm transition-all duration-150"
      style={
        {
          ...(active
            ? { background: "rgba(74,85,190,0.07)", borderLeft: "2px solid #4A55BE", color: "#4A55BE" }
            : { borderLeft: "2px solid transparent", color: "#5A5247" }),
          "--sb-accent": accentColor,
        } as unknown as React.CSSProperties
      }
    >
      <div className="flex items-center gap-2.5">
        <item.Icon
          className="sb-navlink-icon w-4 h-4 flex-shrink-0"
          style={{ color: active ? accentColor : "#9B9188" }}
        />
        <span className="font-medium text-[13px]" style={{ fontFamily: "var(--font-plex-sans), sans-serif" }}>
          {item.label}
        </span>
      </div>
      {active && <ChevronRight className="w-3 h-3" style={{ color: "#4A55BE" }} />}
    </Link>
  );
}

function CollapsibleGroup({
  group,
  accentColor,
  pathname,
  defaultOpen,
}: {
  group: NavGroup;
  accentColor: string;
  pathname: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="sb-group-btn w-full flex items-center justify-between px-3 py-1.5 rounded transition-colors duration-150"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#9B9188", fontFamily: "var(--font-plex-sans), sans-serif" }}
        >
          {group.label}
        </span>
        <ChevronRight
          className="sb-chevron w-3 h-3"
          style={{ color: "#C4BDB5", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} accentColor={accentColor} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ role }: { role: SidebarRole }) {
  const pathname = usePathname();
  const config = roleConfig[role];
  const accentColor = iconAccentColor[role];
  const isAdmin = role === "admin" || role === "super_admin";
  const isEarc = role === "earc_staff";
  const isCoreMember = role === "group_core_member";
  const groups = role === "super_admin" ? [...adminGroups, earcPanelGroup, superAdminGroup] : [...adminGroups, earcPanelGroup];

  const { user } = useUser();
  const { signOut } = useClerk();
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const initialOpen = (group: NavGroup) =>
    group.items.some((item) => isItemActive(item.href, pathname));

  const flatItems = isEarc
    ? earcNavItems
    : isCoreMember
    ? coreMemberNavItems
    : (flatNavItems[role as "enrollee" | "volunteer"] ?? []);

  const helpGroups: NavGroup[] = isAdmin ? groups : [{ label: config.label, items: flatItems }];

  useEffect(() => {
    if (role !== "volunteer" || !user?.id) return;

    const clientDb = createClientClient();
    let isMounted = true;

    async function fetchProgress() {
      try {
        const { data: suUser } = await clientDb
          .from("users")
          .select("id")
          .eq("clerk_id", user!.id)
          .single();

        if (!suUser || !isMounted) return;

        const { data: activeForms } = await clientDb
          .from("dynamic_forms")
          .select("id")
          .in("target_role", ["volunteer", "all"])
          .eq("status", "active")
          .eq("is_template", false);

        if (!activeForms || !isMounted) return;

        if (activeForms.length === 0) {
          setProgress({ completed: 0, total: 0 });
          return;
        }

        const formIds = activeForms.map((f) => f.id);
        const { data: submissions } = await clientDb
          .from("form_submissions")
          .select("form_id")
          .eq("submitted_by", suUser.id)
          .in("form_id", formIds);

        if (!isMounted) return;

        const completedIds = new Set(submissions?.map((s) => s.form_id) ?? []);
        setProgress({
          completed: completedIds.size,
          total: activeForms.length,
        });
      } catch (err) {
        console.error("Error fetching progress:", err);
      }
    }

    fetchProgress();

    // Subscribe to form submissions changes to auto-refresh the progress bar
    const channel = clientDb
      .channel("sidebar-progress-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "form_submissions" },
        () => {
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clientDb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on user.id only; `user` gets a new reference every render
  }, [role, user?.id]);

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{ height: 56, background: "#FFFFFF", borderBottom: "1px solid #E4DFD1" }}
      >
        <NextImage src="/logo_wide.png" alt="Gyan Setu" width={100} height={30} style={{ height: 30, width: "auto", objectFit: "contain" }} />
        <div className="flex items-center gap-2">
          {role === "volunteer" && <NotificationBell />}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex items-center justify-center rounded"
            style={{ width: 36, height: 36, background: "none", border: "1.5px solid #E4DFD1", cursor: "pointer" }}
          >
            {mobileOpen ? <X className="w-4 h-4" style={{ color: "#19140F" }} /> : <Menu className="w-4 h-4" style={{ color: "#19140F" }} />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          style={{ background: "rgba(25,20,15,0.4)" }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 lg:w-56 min-h-screen flex flex-col flex-shrink-0 fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ background: "#FFFFFF", borderRight: "1px solid #E4DFD1" }}
      >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #E4DFD1" }}>
        <div className="flex items-center mb-4" style={{ minHeight: 36 }}>
          <NextImage src="/logo_wide.png" alt="Gyan Setu" width={120} height={36} style={{ height: 36, width: "auto", objectFit: "contain" }} />
        </div>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded"
          style={{ background: config.bgColor }}
        >
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.dotColor }} />
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: config.textColor, fontFamily: "var(--font-plex-sans), sans-serif" }}
          >
            {config.label}
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 mt-2.5 px-0.5"
          style={{ fontSize: 12, color: "#9B9188", textDecoration: "none" }}
        >
          <Globe className="w-3.5 h-3.5" />
          <span style={{ fontFamily: "var(--font-plex-sans), sans-serif" }}>Back to Website</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin ? (
          <div className="space-y-1">
            {groups.map((group) => (
              <CollapsibleGroup
                key={group.label}
                group={group}
                accentColor={accentColor}
                pathname={pathname}
                defaultOpen={initialOpen(group)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {flatItems.map((item) => (
              <NavLink key={item.href} item={item} accentColor={accentColor} pathname={pathname} />
            ))}
          </div>
        )}
      </nav>

      {/* Progress Bar */}
      {role === "volunteer" && progress && (
        <div className="px-4 py-3.5" style={{ borderTop: "1px solid #E4DFD1" }}>
          <div className="flex justify-between items-center mb-1.5" style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", fontFamily: "var(--font-plex-sans), sans-serif" }}>
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#2A5E3A]" /> Tasks & Forms
            </span>
            <span className="font-mono text-[#2A5E3A] text-[10px]">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-[#F3F0E8] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#2A5E3A] h-1.5 transition-all duration-300 rounded-full"
              style={{
                width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid #E4DFD1" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            <p className="text-xs truncate" style={{ color: "#9B9188", fontFamily: "var(--font-plex-sans), sans-serif" }}>
              Account
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            aria-label="Log out"
            title="Log out"
            className="flex items-center justify-center rounded flex-shrink-0"
            style={{ width: 28, height: 28, background: "none", border: "1.5px solid #E4DFD1" }}
          >
            <LogOut className="w-3.5 h-3.5" style={{ color: "#9B9188" }} />
          </button>
          </div>
        </div>
      </div>
      </aside>

      <button
        onClick={() => setHelpOpen(true)}
        aria-label="Help"
        title="Help"
        className="fixed z-40 flex items-center justify-center rounded-full shadow-lg"
        style={{ bottom: 20, right: 20, width: 46, height: 46, background: accentColor, border: "none", cursor: "pointer" }}
      >
        <HelpCircle className="w-5 h-5" style={{ color: "white" }} />
      </button>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(25,20,15,0.45)" }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="w-full max-w-2xl my-8 sm:my-0 rounded-xl"
            style={{ background: "#FFFFFF", border: "1px solid #E4DFD1", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E4DFD1" }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", margin: 0 }}>
                  {config.label} Panel
                </p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#19140F", margin: "2px 0 0" }}>What each section does</h2>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                aria-label="Close help"
                className="flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 30, height: 30, background: "none", border: "1.5px solid #E4DFD1", cursor: "pointer" }}
              >
                <X className="w-4 h-4" style={{ color: "#5A5247" }} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5">
              {helpGroups.map((group) => (
                <div key={group.label}>
                  {isAdmin && (
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: accentColor, marginBottom: 8 }}>
                      {group.label}
                    </p>
                  )}
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.href} className="flex items-start gap-3">
                        <item.Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#19140F", margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: 12.5, color: "#5A5247", margin: "2px 0 0", lineHeight: 1.5 }}>{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
