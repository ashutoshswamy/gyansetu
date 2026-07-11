"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import type { UserRole } from "@/types";
import { createClientClient } from "@/lib/supabase/client";
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
  ChevronDown,
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
  Briefcase,
  FolderOpen,
  GraduationCap,
  BookMarked,
  ShieldCheck,
} from "lucide-react";

type NavItem = { label: string; href: string; Icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const adminGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", Icon: BarChart2 },
    ],
  },
  {
    label: "Tours & Travel",
    items: [
      { label: "Tours",     href: "/admin/tours",     Icon: Plane },
      { label: "Visits",    href: "/admin/visits",    Icon: MapPin },
      { label: "Groups",    href: "/admin/groups",    Icon: UsersRound },

      { label: "Events",    href: "/admin/events",    Icon: Calendar },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Enrollments",      href: "/admin/students",   Icon: UserCheck },
      { label: "Volunteers",       href: "/admin/volunteers", Icon: Users },
      { label: "Profile Data",     href: "/admin/profiles",   Icon: UserCircle },
    ],
  },
  {
    label: "Assessment",
    items: [
      { label: "Tests", href: "/admin/tests", Icon: ClipboardList },
      { label: "Forms", href: "/admin/forms", Icon: FileText },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Gallery",    href: "/admin/gallery",    Icon: Images },
      { label: "Media",      href: "/admin/media",      Icon: Image },
      { label: "Blog",       href: "/admin/blog",       Icon: Rss },
      { label: "Newsletter", href: "/admin/newsletter", Icon: Newspaper },
    ],
  },
  {
    label: "Awards",
    items: [
      { label: "Certificates", href: "/admin/certificates", Icon: Award },
    ],
  },
  {
    label: "Outreach",
    items: [
      { label: "Testimonials", href: "/admin/testimonials", Icon: MessageSquare },
      { label: "Sponsors",     href: "/admin/sponsors",     Icon: Handshake },
      { label: "Careers",      href: "/admin/careers",      Icon: Briefcase },
      { label: "Alumni",       href: "/admin/alumni",       Icon: GraduationCap },
    ],
  },
  {
    label: "EARC",
    items: [
      { label: "EARC Staff", href: "/admin/earc-staff", Icon: ShieldCheck },
    ],
  },
];

const earcNavItems: NavItem[] = [
  { label: "Dashboard",      href: "/earc",                   Icon: LayoutDashboard },
  { label: "Student Data",   href: "/earc/student-data",      Icon: GraduationCap },
  { label: "Programme Data", href: "/earc/programme-data",    Icon: BookMarked },
  { label: "Documents",      href: "/earc/documents",         Icon: FolderOpen },
];

const flatNavItems: Record<"enrollee" | "volunteer", NavItem[]> = {
  enrollee: [
    { label: "Dashboard",  href: "/student",         Icon: LayoutDashboard },
    { label: "Open Tours", href: "/student/tours",   Icon: Plane },
    { label: "My Tests",   href: "/student/tests",   Icon: ClipboardList },
    { label: "My Forms",   href: "/student/forms",   Icon: FileText },
    { label: "My Profile", href: "/student/profile", Icon: UserCircle },
  ],
  volunteer: [
    { label: "Dashboard",     href: "/volunteer",              Icon: LayoutDashboard },
    { label: "My Tours",      href: "/volunteer/tours",        Icon: Plane },
    { label: "Tasks & Forms", href: "/volunteer/forms",        Icon: CheckSquare },
    { label: "Events",        href: "/volunteer/events",       Icon: Calendar },
    { label: "My Group",      href: "/volunteer/groups",       Icon: UsersRound },
    { label: "Daily Log",     href: "/volunteer/daily-log",    Icon: BookOpen },
    { label: "Media",         href: "/volunteer/media",        Icon: Image },
    { label: "Certificates",  href: "/volunteer/certificates", Icon: Award },
    { label: "My Profile",    href: "/volunteer/profile",      Icon: UserCircle },
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
};

const iconAccentColor: Record<SidebarRole, string> = {
  admin: "#4A55BE",
  enrollee: "#1E5A8A",
  volunteer: "#2A5E3A",
  earc_staff: "#B8381E",
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
      className="flex items-center justify-between px-3 py-[7px] rounded text-sm transition-all duration-150"
      style={
        active
          ? { background: "rgba(74,85,190,0.07)", borderLeft: "2px solid #4A55BE", color: "#4A55BE" }
          : { borderLeft: "2px solid transparent", color: "#5A5247" }
      }
    >
      <div className="flex items-center gap-2.5">
        <item.Icon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: active ? accentColor : "#9B9188" }}
        />
        <span className="font-medium text-[13px]" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
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
        className="w-full flex items-center justify-between px-3 py-1.5 rounded transition-colors duration-150"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: "#9B9188", fontFamily: "var(--font-poppins), sans-serif" }}
        >
          {group.label}
        </span>
        {open
          ? <ChevronDown className="w-3 h-3" style={{ color: "#C4BDB5" }} />
          : <ChevronRight className="w-3 h-3" style={{ color: "#C4BDB5" }} />
        }
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
  const isAdmin = role === "admin";
  const isEarc = role === "earc_staff";

  const { user } = useUser();
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  const initialOpen = (group: NavGroup) =>
    group.items.some((item) => isItemActive(item.href, pathname));

  const flatItems = isEarc
    ? earcNavItems
    : (flatNavItems[role as "enrollee" | "volunteer"] ?? []);

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
    <aside
      className="w-56 min-h-screen flex flex-col flex-shrink-0"
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
            style={{ color: config.textColor, fontFamily: "var(--font-poppins), sans-serif" }}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin ? (
          <div className="space-y-1">
            {adminGroups.map((group) => (
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
          <div className="flex justify-between items-center mb-1.5" style={{ fontSize: 11, fontWeight: 600, color: "#5A5247", fontFamily: "var(--font-poppins), sans-serif" }}>
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
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          <p className="text-xs" style={{ color: "#9B9188", fontFamily: "var(--font-poppins), sans-serif" }}>
            Account
          </p>
        </div>
      </div>
    </aside>
  );
}
