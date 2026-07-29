import { SiteNavbar } from "@/components/landing/site-navbar";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteNavbar />
      <div style={{ paddingTop: 64 }}>{children}</div>
    </>
  );
}
