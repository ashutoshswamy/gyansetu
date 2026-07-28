import type { ComponentProps } from "react";
import { getEarcCandidates } from "@/actions/users";
import { getSchoolProfiles, getStudentProfiles } from "@/actions/earc";
import { requireAdminUser } from "@/lib/clerk/action-auth";
import { redirect } from "next/navigation";
import { EarcDashboardTabs } from "./earc-dashboard-tabs";

export default async function EarcStaffPage() {
  let userId: string;
  let users: Awaited<ReturnType<typeof getEarcCandidates>>;
  let schoolProfiles: Awaited<ReturnType<typeof getSchoolProfiles>>;
  let studentProfiles: Awaited<ReturnType<typeof getStudentProfiles>>;
  try {
    ({ userId } = await requireAdminUser());
    [users, schoolProfiles, studentProfiles] = await Promise.all([
      getEarcCandidates(),
      getSchoolProfiles(),
      getStudentProfiles(),
    ]);
  } catch (err) {
    console.error("[earc-staff page]", err);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>
            Admin
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>EARC Staff</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>
            Manage staff access and review submitted EARC data
          </p>
        </div>

        <EarcDashboardTabs
          users={users}
          currentUserId={userId}
          schoolProfiles={schoolProfiles as unknown as ComponentProps<typeof EarcDashboardTabs>["schoolProfiles"]}
          studentProfiles={studentProfiles as unknown as ComponentProps<typeof EarcDashboardTabs>["studentProfiles"]}
        />
      </div>
    </div>
  );
}
