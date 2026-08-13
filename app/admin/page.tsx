import { verifyAdminSession } from "@/lib/admin-auth";
import dynamic from "next/dynamic";

const AdminLoginClient = dynamic(
  () => import("./_components/AdminLoginClient").then((mod) => mod.AdminLoginClient),
  { ssr: false }
);

const AdminDashboardClient = dynamic(
  () => import("./_components/AdminDashboardClient").then((mod) => mod.AdminDashboardClient),
  { ssr: false }
);

export default function AdminPage() {
  const isAuthed = verifyAdminSession();

  if (!isAuthed) {
    return <AdminLoginClient />;
  }

  return <AdminDashboardClient />;
}
