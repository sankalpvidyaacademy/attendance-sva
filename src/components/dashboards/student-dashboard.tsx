"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  ClipboardCheck,
  Plane,
  PartyPopper,
  Plus,
  CalendarDays,
  BarChart3,
  UserCircle,
  Sparkles,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { SUBJECT_ATTENDANCE_STATUS } from "@/lib/constants";

// ─── Color Theme ───────────────────────────────────────
const THEME = {
  primary: "#2F2FE4",
  secondary: "#162E93",
  accent: "#1A1953",
  dark: "#080616",
} as const;

// ─── Status Badge Color Map ────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700 dark:bg-emerald-500 dark:text-white",
  ABSENT: "bg-red-100 text-red-700 dark:bg-red-500 dark:text-white",
  LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-500 dark:text-white",
  HOLIDAY: "bg-purple-100 text-purple-700 dark:bg-purple-500 dark:text-white",
  NO_CLASS: "bg-gray-100 text-gray-700 dark:bg-gray-400 dark:text-white",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500 dark:text-white",
  APPROVED: "bg-green-100 text-green-700 dark:bg-emerald-500 dark:text-white",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-500 dark:text-white",
};

// ─── Sidebar Nav Items ─────────────────────────────────
type StudentTab = "attendance" | "leave" | "holidays";

const SIDEBAR_ITEMS: { key: StudentTab; label: string; icon: React.ElementType }[] = [
  { key: "attendance", label: "Attendance", icon: ClipboardCheck },
  { key: "leave", label: "Leave", icon: Plane },
  { key: "holidays", label: "Holidays", icon: PartyPopper },
];

const TAB_TITLES: Record<StudentTab, string> = {
  attendance: "Attendance",
  leave: "Leave",
  holidays: "Holidays",
};

// ─── Types ─────────────────────────────────────────────
interface StudentDashboardProps {
  user: {
    id: string;
    userId: string;
    name: string;
    role: string;
    class?: string | null;
    subjects?: string[] | null;
    chatId?: string | null;
    phone?: string | null;
  };
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  user?: { name: string; userId: string; role: string; class: string | null };
}

interface SubjectAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  subject: string;
  status: string;
  markedBy: string | null;
  user?: { name: string; userId: string; role: string; class: string | null };
}

interface LeaveRequest {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  remark: string | null;
  status: string;
  createdAt: string;
  user?: { name: string; userId: string; role: string; class: string | null };
}

interface Holiday {
  id: string;
  date: string;
  remark: string | null;
  classes: string[] | string;
}

// ─── Component ─────────────────────────────────────────
export function StudentDashboard({ user }: StudentDashboardProps) {
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useTheme();

  // ── Navigation state ──
  const [activeTab, setActiveTab] = useState<StudentTab>("attendance");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Attendance tab state ──
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attStartDate, setAttStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return format(d, "yyyy-MM-dd");
  });
  const [attEndDate, setAttEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // ── Subject attendance state ──
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [subjectRecords, setSubjectRecords] = useState<SubjectAttendanceRecord[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  // ── Monthly summary state ──
  const [summaryMonth, setSummaryMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    present: number;
    absent: number;
    leave: number;
    holiday: number;
  }>({ present: 0, absent: 0, leave: 0, holiday: 0 });

  // ── Leave tab state ──
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveFromDate, setLeaveFromDate] = useState<Date>();
  const [leaveToDate, setLeaveToDate] = useState<Date>();
  const [leaveRemark, setLeaveRemark] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // ── Holidays tab state ──
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // ── Date picker open states ──
  const [attStartPickerOpen, setAttStartPickerOpen] = useState(false);
  const [attEndPickerOpen, setAttEndPickerOpen] = useState(false);
  const [subjectDatePickerOpen, setSubjectDatePickerOpen] = useState(false);
  const [leaveFromPickerOpen, setLeaveFromPickerOpen] = useState(false);
  const [leaveToPickerOpen, setLeaveToPickerOpen] = useState(false);

  // ── Fetch attendance records ──
  const fetchAttendance = useCallback(async () => {
    setAttendanceLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.userId,
        startDate: attStartDate,
        endDate: attEndDate,
      });
      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      if (data.records) {
        setAttendanceRecords(data.records);
      }
    } catch {
      toast.error("Failed to load attendance records");
    } finally {
      setAttendanceLoading(false);
    }
  }, [user.userId, attStartDate, attEndDate]);

  // ── Fetch subject attendance for selected date ──
  const fetchSubjectAttendance = useCallback(async () => {
    setSubjectLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.userId,
        date: selectedDate,
      });
      const res = await fetch(`/api/subject-attendance?${params}`);
      const data = await res.json();
      setSubjectRecords(data.records || []);
    } catch {
      toast.error("Failed to load subject attendance");
    } finally {
      setSubjectLoading(false);
    }
  }, [user.userId, selectedDate]);

  // ── Fetch monthly summary ──
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const startDate = `${summaryMonth}-01`;
      const [year, mon] = summaryMonth.split("-").map(Number);
      const nextMonth = mon === 12 ? 1 : mon + 1;
      const nextYear = mon === 12 ? year + 1 : year;

      const params = new URLSearchParams({
        userId: user.userId,
        startDate,
        endDate: `${nextYear}-${String(nextMonth).padStart(2, "0")}-31`,
      });
      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      const records: AttendanceRecord[] = data.records || [];

      const counts = { present: 0, absent: 0, leave: 0, holiday: 0 };
      for (const r of records) {
        const s = r.status.toUpperCase();
        if (s === "PRESENT") counts.present++;
        else if (s === "ABSENT") counts.absent++;
        else if (s === "LEAVE") counts.leave++;
        else if (s === "HOLIDAY") counts.holiday++;
      }
      setSummaryData(counts);
    } catch {
      toast.error("Failed to load monthly summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [user.userId, summaryMonth]);

  // ── Fetch leave requests ──
  const fetchLeaves = useCallback(async () => {
    setLeaveLoading(true);
    try {
      const params = new URLSearchParams({ userId: user.userId });
      const res = await fetch(`/api/leave?${params}`);
      const data = await res.json();
      setLeaveRequests(data.leaveRequests || []);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLeaveLoading(false);
    }
  }, [user.userId]);

  // ── Fetch holidays ──
  const fetchHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const studentClass = user.class || "";
      const params = new URLSearchParams();
      if (studentClass) {
        params.set("class", studentClass);
      }
      const res = await fetch(`/api/holidays?${params}`);
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setHolidaysLoading(false);
    }
  }, [user.class]);

  // ── Effects ──
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { fetchSubjectAttendance(); }, [fetchSubjectAttendance]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);
  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  // ── Apply leave ──
  const handleApplyLeave = async () => {
    if (!leaveFromDate || !leaveToDate) {
      toast.error("Please select from and to dates");
      return;
    }
    const fromStr = format(leaveFromDate, "yyyy-MM-dd");
    const toStr = format(leaveToDate, "yyyy-MM-dd");
    if (fromStr > toStr) {
      toast.error("From date must be before or equal to to date");
      return;
    }
    setLeaveSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          fromDate: fromStr,
          toDate: toStr,
          remark: leaveRemark,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to apply leave");
      }
      toast.success("Leave request submitted");
      setLeaveDialogOpen(false);
      setLeaveFromDate(undefined);
      setLeaveToDate(undefined);
      setLeaveRemark("");
      fetchLeaves();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply leave");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // ── Status badge helper ──
  const statusBadge = (status: string) => {
    const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-700 dark:bg-gray-300 dark:text-gray-800";
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
          colorClass
        )}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  // ── Format check-in/out time ──
  const formatCheckTime = (isoString: string | null) => {
    if (!isoString) return "—";
    try {
      return format(new Date(isoString), "hh:mm a");
    } catch {
      return "—";
    }
  };

  // ── Format date display ──
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  // ── Parse holiday classes ──
  const parseHolidayClasses = (classes: string[] | string): string[] => {
    if (Array.isArray(classes)) return classes;
    try {
      return JSON.parse(classes);
    } catch {
      return ["ALL"];
    }
  };

  // ── Summary percentage helper ──
  const total = summaryData.present + summaryData.absent + summaryData.leave + summaryData.holiday;
  const presentPercent = total > 0 ? Math.round((summaryData.present / total) * 100) : 0;

  // ── Sidebar nav click handler ──
  const handleNavClick = (tab: StudentTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // ────────────────────────────────────────────────────────
  // SIDEBAR COMPONENT
  // ────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card dark:bg-[#1A1953]">
      {/* Logo area */}
      <div className="px-5 py-6 border-b dark:border-white/10 border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl dark:bg-white/15 bg-muted backdrop-blur-sm border dark:border-white/20 border-border">
            <Sparkles className="size-5 text-foreground dark:text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground dark:text-white leading-tight">Sankalp Attendance</h2>
            <p className="text-xs text-foreground dark:text-white/60">Student Panel</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNavClick(key)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-foreground dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
            )}
          >
            <Icon className="size-5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t dark:border-white/10 border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="flex items-center justify-center size-9 rounded-full dark:bg-white/15 bg-muted">
            <UserCircle className="size-5 text-foreground dark:text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-foreground dark:text-white/50 truncate">
              {user.userId}
              {user.class && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md dark:bg-white/15 bg-muted text-[10px] font-medium text-foreground dark:text-white">
                  {user.class}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white transition-all"
        >
          <LogOut className="size-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-background">
      {/* ════════════ DESKTOP SIDEBAR ════════════ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-50">
        <SidebarContent />
      </aside>

      {/* ════════════ MOBILE SIDEBAR OVERLAY ════════════ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar drawer */}
          <div className="fixed inset-y-0 left-0 w-60 z-50 animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
          {/* Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="fixed top-4 left-64 z-50 size-8 flex items-center justify-center rounded-full dark:bg-white/10 bg-muted text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/20"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ════════════ MAIN AREA ════════════ */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-40 shadow-xl bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:via-[#162E93] dark:to-[#2F2FE4]"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden size-10 flex items-center justify-center rounded-xl dark:bg-white/10 bg-primary/20 text-primary-foreground hover:bg-muted dark:hover:bg-white/20 transition-colors"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-primary-foreground leading-tight tracking-tight">
                  {TAB_TITLES[activeTab]}
                </h1>
                <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
                  <UserCircle className="size-3" />
                  Welcome, {user.name}
                  {user.class && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md dark:bg-white/15 bg-primary/20 text-[10px] font-medium text-primary-foreground">
                      {user.class}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="gap-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 w-full px-4 py-5 sm:px-6 sm:py-6">

          {/* ════════════ ATTENDANCE TAB ════════════ */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              {/* ── Attendance History Card ── */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader
                  className="pb-4 bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93] text-center"
                >
                  <CardTitle className="text-primary-foreground flex items-center justify-center gap-2">
                    <ClipboardCheck className="size-5" />
                    My Attendance History
                  </CardTitle>
                  <CardDescription className="text-foreground/60 dark:text-blue-200">
                    View your check-in / check-out records
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 bg-card text-card-foreground">
                  {/* Date range filter */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-sm whitespace-nowrap font-medium">From</Label>
                      <Popover open={attStartPickerOpen} onOpenChange={setAttStartPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <CalendarDays className="size-4 mr-2 text-primary" />
                            {attStartDate ? formatDateDisplay(attStartDate) : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={attStartDate ? new Date(attStartDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setAttStartDate(format(date, "yyyy-MM-dd"));
                                setAttStartPickerOpen(false);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-sm whitespace-nowrap font-medium">To</Label>
                      <Popover open={attEndPickerOpen} onOpenChange={setAttEndPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal rounded-xl"
                          >
                            <CalendarDays className="size-4 mr-2 text-primary" />
                            {attEndDate ? formatDateDisplay(attEndDate) : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={attEndDate ? new Date(attEndDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                setAttEndDate(format(date, "yyyy-MM-dd"));
                                setAttEndPickerOpen(false);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      onClick={fetchAttendance}
                      className="gap-2 rounded-xl shadow-md text-white min-w-[100px] bg-primary"
                    >
                      <Loader2 className={cn("size-4", attendanceLoading && "animate-spin")} />
                      Refresh
                    </Button>
                  </div>

                  {/* Attendance table */}
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ClipboardCheck className="size-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No attendance records found for this period</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableHead className="font-semibold">Date</TableHead>
                              <TableHead className="font-semibold">Check-In</TableHead>
                              <TableHead className="font-semibold">Check-Out</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceRecords.map((record) => (
                              <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">
                                  {formatDateDisplay(record.date)}
                                </TableCell>
                                <TableCell>{formatCheckTime(record.checkIn)}</TableCell>
                                <TableCell>{formatCheckTime(record.checkOut)}</TableCell>
                                <TableCell>{statusBadge(record.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Subject-wise Attendance Card ── */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader
                  className="pb-4 bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-primary-foreground flex items-center gap-2">
                        <BookOpen className="size-5" />
                        Subject-wise Attendance
                      </CardTitle>
                      <CardDescription className="text-foreground/60 dark:text-blue-200">
                        Select a date to see subject attendance
                      </CardDescription>
                    </div>
                    <Popover open={subjectDatePickerOpen} onOpenChange={setSubjectDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto justify-start text-left font-normal gap-2 dark:bg-white/10 border-border text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/20 hover:text-foreground dark:text-white rounded-xl"
                        >
                          <CalendarDays className="size-4" />
                          {selectedDate ? formatDateDisplay(selectedDate) : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate ? new Date(selectedDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(format(date, "yyyy-MM-dd"));
                              setSubjectDatePickerOpen(false);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 bg-card text-card-foreground">
                  {subjectLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : subjectRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="size-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No subject attendance records for {formatDateDisplay(selectedDate)}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">Subject</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjectRecords.map((record) => (
                            <TableRow key={record.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{record.subject}</TableCell>
                              <TableCell>{statusBadge(record.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Monthly Summary Card ── */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader
                  className="pb-4 bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-primary-foreground flex items-center gap-2">
                        <BarChart3 className="size-5" />
                        Monthly Summary
                      </CardTitle>
                      <CardDescription className="text-foreground/60 dark:text-blue-200">
                        Attendance breakdown for the selected month
                      </CardDescription>
                    </div>
                    <Input
                      type="month"
                      value={summaryMonth}
                      onChange={(e) => setSummaryMonth(e.target.value)}
                      className="w-full sm:w-44 rounded-xl dark:bg-white/10 border-border text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-blue-300 [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 bg-card text-card-foreground">
                  {summaryLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <>
                      {/* Percentage bar */}
                      {total > 0 && (
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground/60">Attendance Rate</span>
                            <span className="text-lg font-bold text-primary">
                              {presentPercent}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${presentPercent}%`,
                                background: `linear-gradient(90deg, ${THEME.secondary}, ${THEME.primary})`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-xl border-2 border-emerald-100 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 text-center">
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summaryData.present}</p>
                          <p className="text-sm text-emerald-700/70 dark:text-emerald-300 mt-1 font-medium">Present</p>
                        </div>
                        <div className="rounded-xl border-2 border-red-100 dark:border-red-500/30 bg-red-50/50 dark:bg-red-500/10 p-4 text-center">
                          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summaryData.absent}</p>
                          <p className="text-sm text-red-700/70 dark:text-red-300 mt-1 font-medium">Absent</p>
                        </div>
                        <div className="rounded-xl border-2 border-amber-100 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 p-4 text-center">
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{summaryData.leave}</p>
                          <p className="text-sm text-amber-700/70 dark:text-amber-300 mt-1 font-medium">Leave</p>
                        </div>
                        <div className="rounded-xl border-2 border-purple-100 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/10 p-4 text-center">
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summaryData.holiday}</p>
                          <p className="text-sm text-purple-700/70 dark:text-purple-300 mt-1 font-medium">Holiday</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════ LEAVE TAB ════════════ */}
          {activeTab === "leave" && (
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                className="pb-4 bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-primary-foreground flex items-center gap-2">
                      <Plane className="size-5" />
                      My Leave Requests
                    </CardTitle>
                    <CardDescription className="text-foreground/60 dark:text-blue-200">
                      View and apply for leave
                    </CardDescription>
                  </div>
                  <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="gap-2 rounded-xl shadow-lg text-white bg-primary"
                      >
                        <Plus className="size-4" />
                        Apply Leave
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Plane className="size-5 text-primary" />
                          Apply for Leave
                        </DialogTitle>
                        <DialogDescription>
                          Select the date range and provide a remark for your leave request
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="font-medium text-foreground">From Date</Label>
                          <Popover open={leaveFromPickerOpen} onOpenChange={setLeaveFromPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl"
                              >
                                <CalendarDays className="size-4 mr-2 text-primary" />
                                {leaveFromDate ? format(leaveFromDate, "dd MMM yyyy") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={leaveFromDate}
                                onSelect={(date) => {
                                  setLeaveFromDate(date);
                                  if (date) setLeaveFromPickerOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium text-foreground">To Date</Label>
                          <Popover open={leaveToPickerOpen} onOpenChange={setLeaveToPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl"
                              >
                                <CalendarDays className="size-4 mr-2 text-primary" />
                                {leaveToDate ? format(leaveToDate, "dd MMM yyyy") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={leaveToDate}
                                onSelect={(date) => {
                                  setLeaveToDate(date);
                                  if (date) setLeaveToPickerOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="leave-remark" className="font-medium text-foreground">Remark</Label>
                          <Input
                            id="leave-remark"
                            placeholder="Reason for leave (optional)"
                            value={leaveRemark}
                            onChange={(e) => setLeaveRemark(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setLeaveDialogOpen(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApplyLeave}
                          disabled={leaveSubmitting}
                          className="gap-2 rounded-xl text-white bg-primary"
                        >
                          {leaveSubmitting && <Loader2 className="size-4 animate-spin" />}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-card text-card-foreground">
                {leaveLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plane className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No leave requests found</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">From</TableHead>
                            <TableHead className="font-semibold">To</TableHead>
                            <TableHead className="font-semibold">Remark</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaveRequests.map((leave) => (
                            <TableRow key={leave.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">
                                {formatDateDisplay(leave.fromDate)}
                              </TableCell>
                              <TableCell>{formatDateDisplay(leave.toDate)}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {leave.remark || "—"}
                              </TableCell>
                              <TableCell>{statusBadge(leave.status)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ════════════ HOLIDAYS TAB ════════════ */}
          {activeTab === "holidays" && (
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                  className="pb-4 bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93] text-center"
                >
                <CardTitle className="text-primary-foreground flex items-center justify-center gap-2">
                  <PartyPopper className="size-5" />
                  Holidays
                </CardTitle>
                <CardDescription className="text-foreground/60 dark:text-blue-200">
                  Holidays applicable to your class
                  {user.class && (
                    <span
                      className="ml-1 px-1.5 py-0.5 rounded-md dark:bg-white/15 bg-muted text-[10px] font-medium text-foreground dark:text-white"
                    >
                      {user.class}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-card text-card-foreground">
                {holidaysLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <PartyPopper className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No holidays found</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Remark</TableHead>
                            <TableHead className="font-semibold">Applicable Classes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holidays.map((holiday) => {
                            const classes = parseHolidayClasses(holiday.classes);
                            return (
                              <TableRow key={holiday.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">
                                  {formatDateDisplay(holiday.date)}
                                </TableCell>
                                <TableCell>{holiday.remark || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {classes.map((cls) => (
                                      <span
                                        key={cls}
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-secondary-foreground bg-secondary"
                                      >
                                        {cls}
                                      </span>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
}
