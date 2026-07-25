import { auth } from "@clerk/nextjs/server";
import { SiteNavbar } from "@/components/landing/site-navbar";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();

  return (
    <>
      <SiteNavbar isLoggedIn={!!userId} />
      <div style={{ paddingTop: 64 }}>{children}</div>
    </>
  );
}
