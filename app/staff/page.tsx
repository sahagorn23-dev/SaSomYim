import { verifyStaffSession } from "@/lib/staff-auth";
import nextDynamic from "next/dynamic";

// Prevent Vercel from caching this page — it reads cookies at request time
export const dynamic = "force-dynamic";

const StaffLoginClient = nextDynamic(
  () => import("./_components/StaffLoginClient").then((mod) => mod.StaffLoginClient),
  { ssr: false }
);

const StaffDashboardClient = nextDynamic(
  () => import("./_components/StaffDashboardClient").then((mod) => mod.StaffDashboardClient),
  { ssr: false }
);

export default function StaffPage() {
  const isAuthed = verifyStaffSession();

  if (!isAuthed) {
    return <StaffLoginClient />;
  }

  return <StaffDashboardClient />;
}
