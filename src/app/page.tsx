"use client";

import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import { LoginForm } from "@/components/login-form";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";

export default function Home() {
  const { user, view } = useAuthStore();

  if (!user || view === "login") {
    return <LoginForm />;
  }

  switch (view) {
    case "admin":
      return <AdminDashboard user={user as AuthUser} />;
    case "teacher":
      return <TeacherDashboard user={user as AuthUser} />;
    case "student":
      return <StudentDashboard user={user as AuthUser} />;
    default:
      return <LoginForm />;
  }
}
