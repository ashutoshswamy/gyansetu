import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllSchoolReports } from "@/actions/school-reports";
import { SchoolReportsAnalytics, type ReportForAnalytics } from "@/components/features/school-reports/school-reports-analytics";
import { fontVars, pageVars, F_DISPLAY, F_BODY } from "@/components/landing/theme";

export default async function SchoolReportsDashboardPage() {
  const reports = await getAllSchoolReports();

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${fontVars}`} style={{ ...pageVars, background: "var(--gs-paper-deep)", fontFamily: F_BODY }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/school-reports"
            className="flex items-center gap-1.5"
            style={{ fontFamily: F_BODY, fontSize: 12.5, color: "var(--gs-text-mute)", textDecoration: "none", marginBottom: 12 }}
          >
            <ArrowLeft size={13} />
            Back to School Reports
          </Link>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, color: "var(--gs-text-mute)", marginBottom: 4 }}>Admin Console</p>
          <h1 style={{ fontFamily: F_DISPLAY, fontSize: 28, fontWeight: 600, color: "var(--gs-text)", margin: 0 }}>School Reports Dashboard</h1>
          <p style={{ fontSize: 14, color: "var(--gs-text-soft)", marginTop: 4 }}>Overview of all school visit reports submitted by volunteers</p>
        </div>

        <SchoolReportsAnalytics reports={reports as unknown as ReportForAnalytics[]} />
      </div>
    </div>
  );
}
