import { requireEarcUser } from "@/lib/clerk/action-auth";
import { getSchoolProfiles, getStudentProfiles } from "@/actions/earc";
import { EarcAnalytics } from "@/components/features/earc/earc-analytics";
import { fontVars, pageVars, F_DISPLAY, F_BODY } from "@/components/landing/theme";

export default async function EarcDashboardPage() {
  await requireEarcUser();
  const [schoolProfiles, studentProfiles] = await Promise.all([getSchoolProfiles(), getStudentProfiles()]);

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${fontVars}`} style={{ ...pageVars, background: "var(--gs-paper-deep)", fontFamily: F_BODY }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-text-mute)", marginBottom: 4 }}>EARC Panel</p>
          <h1 style={{ fontFamily: F_DISPLAY, fontSize: 28, fontWeight: 600, color: "var(--gs-text)", margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-soft)", marginTop: 4 }}>Overview of all submitted school and student data</p>
        </div>

        <EarcAnalytics
          schoolProfiles={schoolProfiles as unknown as Parameters<typeof EarcAnalytics>[0]["schoolProfiles"]}
          studentProfiles={studentProfiles as unknown as Parameters<typeof EarcAnalytics>[0]["studentProfiles"]}
        />
      </div>
    </div>
  );
}
