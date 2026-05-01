"use client";

import { useEffect } from "react";
import { useAuthStore, hydrateAuthStore, useHasHydrated, type AuthUser } from "@/stores/auth-store";
import { LoginForm } from "@/components/login-form";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { TeacherDashboard } from "@/components/dashboards/teacher-dashboard";
import { StudentDashboard } from "@/components/dashboards/student-dashboard";

export default function Home() {
  const { user, view } = useAuthStore();
  const hasHydrated = useHasHydrated();

  // Hydrate auth store from localStorage on mount
  useEffect(() => {
    hydrateAuthStore();
  }, []);

  // Show loading until hydration is complete (prevents flash of login page)
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
