import { requireEarcUser } from "@/lib/clerk/action-auth";
import { getSchoolProfiles, getStudentProfiles } from "@/actions/earc";
import { EarcAnalytics } from "@/components/features/earc/earc-analytics";

export default async function EarcDashboardPage() {
  await requireEarcUser();
  const [schoolProfiles, studentProfiles] = await Promise.all([getSchoolProfiles(), getStudentProfiles()]);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "#FAFAF7" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "#9B9188", marginBottom: 4 }}>EARC Panel</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#19140F", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "#5A5247", marginTop: 4 }}>Overview of all submitted school and student data</p>
        </div>

        <EarcAnalytics
          schoolProfiles={schoolProfiles as unknown as Parameters<typeof EarcAnalytics>[0]["schoolProfiles"]}
          studentProfiles={studentProfiles as unknown as Parameters<typeof EarcAnalytics>[0]["studentProfiles"]}
        />
      </div>
    </div>
  );
}
