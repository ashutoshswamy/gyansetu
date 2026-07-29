import { NotificationBell } from "@/components/features/notifications/notification-bell";
import type { UserRole } from "@/types";

// Desktop-only: mobile already gets its own top-right bell inside Sidebar's mobile bar.
export function TopBar({ role }: { role: UserRole | null }) {
  if (role !== "volunteer") return null;

  return (
    <div
      className="hidden lg:flex items-center justify-end px-8 py-3"
      style={{ borderBottom: "1px solid #E4DFD1", background: "#FAFAF7" }}
    >
      <NotificationBell />
    </div>
  );
}
