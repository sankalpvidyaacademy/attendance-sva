"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Loader2,
  LogOut,
  CalendarDays,
  ClipboardCheck,
  Plane,
  PartyPopper,
  Save,
  Plus,
  UserCircle,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { SUBJECT_ATTENDANCE_STATUS, CLASSES } from "@/lib/constants";

// ─── Color Theme ───────────────────────────────────────
const THEME = {
  primary: "#2F2FE4",
  secondary: "#162E93",
  accent: "#1A1953",
  dark: "#080616",
} as const;

// ─── Status Badge Color Map ────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-500 text-white",
  ABSENT: "bg-red-500 text-white",
  LEAVE: "bg-amber-500 text-white",
  HOLIDAY: "bg-purple-500 text-white",
  NO_CLASS: "bg-gray-400 text-white",
  PENDING: "bg-amber-500 text-white",
  APPROVED: "bg-emerald-500 text-white",
  REJECTED: "bg-red-500 text-white",
};

// ─── Types ─────────────────────────────────────────────
interface TeacherDashboardProps {
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

interface Student {
  id: string;
  userId: string;
  name: string;
  role: string;
  class: string | null;
}

// ─── Component ─────────────────────────────────────────
export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const logout = useAuthStore((s) => s.logout);

  // ── Attendance tab state ──
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attStartDate, setAttStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return format(d, "yyyy-MM-dd");
  });
  const [attEndDate, setAttEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // ── Mark Attendance tab state ──
  const [markDate, setMarkDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [markSubject, setMarkSubject] = useState("");
  const [markClass, setMarkClass] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving] = useState(false);

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
  const [markDatePickerOpen, setMarkDatePickerOpen] = useState(false);
  const [leaveFromPickerOpen, setLeaveFromPickerOpen] = useState(false);
  const [leaveToPickerOpen, setLeaveToPickerOpen] = useState(false);

  // ── Derived: teacher's subjects ──
  const teacherSubjects: string[] = user.subjects
    ? Array.isArray(user.subjects)
      ? user.subjects
      : []
    : [];

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

  // ── Fetch students when class changes ──
  const fetchStudents = useCallback(async (className: string) => {
    if (!className) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams({
        role: "STUDENT",
        class: className,
      });
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      const studentList = Array.isArray(data) ? data : [];
      setStudents(studentList);
      const initial: Record<string, string> = {};
      for (const s of studentList) {
        initial[s.userId] = SUBJECT_ATTENDANCE_STATUS.PRESENT;
      }
      setStudentStatuses(initial);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

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
      const res = await fetch("/api/holidays");
      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch {
      toast.error("Failed to load holidays");
    } finally {
      setHolidaysLoading(false);
    }
  }, []);

  // ── Effects ──
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);
  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);
  useEffect(() => {
    if (markClass) { fetchStudents(markClass); }
  }, [markClass, fetchStudents]);

  // ── Save subject attendance ──
  const handleSaveAttendance = async () => {
    if (!markDate || !markSubject || !markClass) {
      toast.error("Please select date, subject, and class");
      return;
    }
    if (students.length === 0) {
      toast.error("No students found");
      return;
    }
    setMarkSaving(true);
    try {
      const promises = students.map((student) =>
        fetch("/api/subject-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: student.userId,
            date: markDate,
            subject: markSubject,
            status: studentStatuses[student.userId] || SUBJECT_ATTENDANCE_STATUS.PRESENT,
            markedBy: user.userId,
          }),
        })
      );
      const results = await Promise.allSettled(promises);
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.warning(`Attendance saved for ${results.length - failed}/${results.length} students`);
      } else {
        toast.success(`Attendance saved for all ${results.length} students`);
      }
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setMarkSaving(false);
    }
  };

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
    const colorClass = STATUS_COLORS[status] || "bg-gray-300 text-gray-800";
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

  // ── Active tab counts ──
  const activeTabClass = "data-[state=active]:text-white data-[state=active]:shadow-lg";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: THEME.dark }}>
      {/* ════════════ HEADER ════════════ */}
      <header
        className="sticky top-0 z-40 shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${THEME.accent} 0%, ${THEME.secondary} 50%, ${THEME.primary} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Sparkles className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight tracking-tight">
                Sankalp Attendance
              </h1>
              <p className="text-xs text-blue-200 flex items-center gap-1">
                <UserCircle className="size-3" />
                Welcome, {user.name}
              </p>
            </div>
          </div>
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
      </header>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 sm:px-6 sm:py-6">
        <Tabs defaultValue="attendance" className="w-full">
          {/* ── Tab Navigation ── */}
          <TabsList
            className="w-full flex flex-wrap mb-5 h-auto p-1 rounded-xl"
            style={{ backgroundColor: THEME.accent }}
          >
            <TabsTrigger
              value="attendance"
              className={cn(
                "flex-1 min-w-0 gap-1.5 py-2.5 rounded-lg text-sm font-medium text-blue-200 transition-all",
                activeTabClass
              )}
            >
              <ClipboardCheck className="size-4" />
              <span className="hidden sm:inline">Attendance</span>
              <span className="sm:hidden text-xs">Att.</span>
            </TabsTrigger>
            <TabsTrigger
              value="mark"
              className={cn(
                "flex-1 min-w-0 gap-1.5 py-2.5 rounded-lg text-sm font-medium text-blue-200 transition-all",
                activeTabClass
              )}
            >
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Mark Attendance</span>
              <span className="sm:hidden text-xs">Mark</span>
            </TabsTrigger>
            <TabsTrigger
              value="leave"
              className={cn(
                "flex-1 min-w-0 gap-1.5 py-2.5 rounded-lg text-sm font-medium text-blue-200 transition-all",
                activeTabClass
              )}
            >
              <Plane className="size-4" />
              <span>Leave</span>
            </TabsTrigger>
            <TabsTrigger
              value="holidays"
              className={cn(
                "flex-1 min-w-0 gap-1.5 py-2.5 rounded-lg text-sm font-medium text-blue-200 transition-all",
                activeTabClass
              )}
            >
              <PartyPopper className="size-4" />
              <span className="hidden sm:inline">Holidays</span>
              <span className="sm:hidden text-xs">Hol.</span>
            </TabsTrigger>
          </TabsList>

          {/* ════════════ ATTENDANCE TAB ════════════ */}
          <TabsContent value="attendance">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                className="pb-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.secondary})`,
                }}
              >
                <CardTitle className="text-white flex items-center gap-2">
                  <ClipboardCheck className="size-5" />
                  My Attendance History
                </CardTitle>
                <CardDescription className="text-blue-200">
                  View your check-in / check-out records
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-white">
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
                          <CalendarDays className="size-4 mr-2" style={{ color: THEME.primary }} />
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
                          <CalendarDays className="size-4 mr-2" style={{ color: THEME.primary }} />
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
                    className="gap-2 rounded-xl shadow-md text-white min-w-[100px]"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    <Loader2 className={cn("size-4", attendanceLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>

                {/* Attendance table */}
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin" style={{ color: THEME.primary }} />
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ClipboardCheck className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No attendance records found for this period</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Check-In</TableHead>
                            <TableHead className="font-semibold">Check-Out</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map((record) => (
                            <TableRow key={record.id} className="hover:bg-blue-50/50 transition-colors">
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
          </TabsContent>

          {/* ════════════ MARK ATTENDANCE TAB ════════════ */}
          <TabsContent value="mark">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                className="pb-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.secondary})`,
                }}
              >
                <CardTitle className="text-white flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  Mark Subject Attendance
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Select date, subject, and class, then mark attendance for each student
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-white">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="font-medium">Date</Label>
                    <Popover open={markDatePickerOpen} onOpenChange={setMarkDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal rounded-xl"
                        >
                          <CalendarDays className="size-4 mr-2" style={{ color: THEME.primary }} />
                          {markDate ? formatDateDisplay(markDate) : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={markDate ? new Date(markDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setMarkDate(format(date, "yyyy-MM-dd"));
                              setMarkDatePickerOpen(false);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="font-medium">Subject</Label>
                    <Select value={markSubject} onValueChange={setMarkSubject}>
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherSubjects.length > 0 ? (
                          teacherSubjects.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No subjects assigned
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <Label className="font-medium">Class</Label>
                    <Select
                      value={markClass}
                      onValueChange={(val) => {
                        setMarkClass(val);
                        setStudentStatuses({});
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xl">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Students list */}
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin" style={{ color: THEME.primary }} />
                    <span className="ml-2 text-sm text-gray-500">Loading students...</span>
                  </div>
                ) : markClass && students.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <UserCircle className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No students found in {markClass}</p>
                  </div>
                ) : !markClass ? (
                  <div className="text-center py-12 text-gray-400">
                    <CalendarDays className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a class to see students</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="w-12 font-semibold">#</TableHead>
                              <TableHead className="font-semibold">Student Name</TableHead>
                              <TableHead className="font-semibold">User ID</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student, idx) => (
                              <TableRow key={student.userId} className="hover:bg-blue-50/50 transition-colors">
                                <TableCell className="text-gray-400">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-gray-400 text-xs">{student.userId}</TableCell>
                                <TableCell>
                                  <Select
                                    value={studentStatuses[student.userId] || SUBJECT_ATTENDANCE_STATUS.PRESENT}
                                    onValueChange={(val) =>
                                      setStudentStatuses((prev) => ({ ...prev, [student.userId]: val }))
                                    }
                                  >
                                    <SelectTrigger className="w-[140px] rounded-xl">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={SUBJECT_ATTENDANCE_STATUS.PRESENT}>Present</SelectItem>
                                      <SelectItem value={SUBJECT_ATTENDANCE_STATUS.ABSENT}>Absent</SelectItem>
                                      <SelectItem value={SUBJECT_ATTENDANCE_STATUS.LEAVE}>Leave</SelectItem>
                                      <SelectItem value={SUBJECT_ATTENDANCE_STATUS.NO_CLASS}>No Class</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={markSaving}
                        className="gap-2 min-w-[160px] rounded-xl shadow-lg text-white"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        {markSaving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        Save All
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════════ LEAVE TAB ════════════ */}
          <TabsContent value="leave">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                className="pb-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.secondary})`,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plane className="size-5" />
                      My Leave Requests
                    </CardTitle>
                    <CardDescription className="text-blue-200">
                      View and apply for leave
                    </CardDescription>
                  </div>
                  <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="gap-2 rounded-xl shadow-lg text-white"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        <Plus className="size-4" />
                        Apply Leave
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Plane className="size-5" style={{ color: THEME.primary }} />
                          Apply for Leave
                        </DialogTitle>
                        <DialogDescription>
                          Select the date range and provide a remark for your leave request
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label className="font-medium">From Date</Label>
                          <Popover open={leaveFromPickerOpen} onOpenChange={setLeaveFromPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl"
                              >
                                <CalendarDays className="size-4 mr-2" style={{ color: THEME.primary }} />
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
                          <Label className="font-medium">To Date</Label>
                          <Popover open={leaveToPickerOpen} onOpenChange={setLeaveToPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal rounded-xl"
                              >
                                <CalendarDays className="size-4 mr-2" style={{ color: THEME.primary }} />
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
                          <Label htmlFor="leave-remark" className="font-medium">Remark</Label>
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
                          className="gap-2 rounded-xl text-white"
                          style={{ backgroundColor: THEME.primary }}
                        >
                          {leaveSubmitting && <Loader2 className="size-4 animate-spin" />}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-white">
                {leaveLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin" style={{ color: THEME.primary }} />
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Plane className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No leave requests found</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold">From</TableHead>
                            <TableHead className="font-semibold">To</TableHead>
                            <TableHead className="font-semibold">Remark</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaveRequests.map((leave) => (
                            <TableRow key={leave.id} className="hover:bg-blue-50/50 transition-colors">
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
          </TabsContent>

          {/* ════════════ HOLIDAYS TAB ════════════ */}
          <TabsContent value="holidays">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader
                className="pb-4"
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.secondary})`,
                }}
              >
                <CardTitle className="text-white flex items-center gap-2">
                  <PartyPopper className="size-5" />
                  Holidays
                </CardTitle>
                <CardDescription className="text-blue-200">
                  List of upcoming and past holidays
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 bg-white">
                {holidaysLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin" style={{ color: THEME.primary }} />
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <PartyPopper className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No holidays found</p>
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Remark</TableHead>
                            <TableHead className="font-semibold">Applicable Classes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {holidays.map((holiday) => {
                            const classes = parseHolidayClasses(holiday.classes);
                            return (
                              <TableRow key={holiday.id} className="hover:bg-blue-50/50 transition-colors">
                                <TableCell className="font-medium">
                                  {formatDateDisplay(holiday.date)}
                                </TableCell>
                                <TableCell>{holiday.remark || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {classes.map((cls) => (
                                      <span
                                        key={cls}
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                                        style={{ backgroundColor: THEME.secondary }}
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
