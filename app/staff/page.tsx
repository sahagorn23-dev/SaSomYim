import { verifyStaffSession } from "@/lib/staff-auth";
import dynamic from "next/dynamic";

const StaffLoginClient = dynamic(
  () => import("./_components/StaffLoginClient").then((mod) => mod.StaffLoginClient),
  { ssr: false }
);

const StaffDashboardClient = dynamic(
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
