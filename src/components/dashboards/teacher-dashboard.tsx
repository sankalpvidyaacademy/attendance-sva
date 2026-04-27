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
  ChevronDown,
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

// ---------- Attendance Record Type ----------
interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  user?: { name: string; userId: string; role: string; class: string | null };
}

// ---------- Leave Request Type ----------
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

// ---------- Holiday Type ----------
interface Holiday {
  id: string;
  date: string;
  remark: string | null;
  classes: string[] | string;
}

// ---------- Student Type ----------
interface Student {
  id: string;
  userId: string;
  name: string;
  role: string;
  class: string | null;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const logout = useAuthStore((s) => s.logout);

  // ---- Attendance tab state ----
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attStartDate, setAttStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return format(d, "yyyy-MM-dd");
  });
  const [attEndDate, setAttEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // ---- Mark Attendance tab state ----
  const [markDate, setMarkDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [markSubject, setMarkSubject] = useState("");
  const [markClass, setMarkClass] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving] = useState(false);

  // ---- Leave tab state ----
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveFromDate, setLeaveFromDate] = useState<Date>();
  const [leaveToDate, setLeaveToDate] = useState<Date>();
  const [leaveRemark, setLeaveRemark] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // ---- Holidays tab state ----
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // ---- Date picker open states ----
  const [attStartPickerOpen, setAttStartPickerOpen] = useState(false);
  const [attEndPickerOpen, setAttEndPickerOpen] = useState(false);
  const [markDatePickerOpen, setMarkDatePickerOpen] = useState(false);
  const [leaveFromPickerOpen, setLeaveFromPickerOpen] = useState(false);
  const [leaveToPickerOpen, setLeaveToPickerOpen] = useState(false);

  // ---- Derived: teacher's subjects ----
  const teacherSubjects: string[] = user.subjects
    ? Array.isArray(user.subjects)
      ? user.subjects
      : []
    : [];

  // ---- Fetch attendance records ----
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

  // ---- Fetch students when class changes ----
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
      // Initialize statuses
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

  // ---- Fetch leave requests ----
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

  // ---- Fetch holidays ----
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

  // ---- Effects ----
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    if (markClass) {
      fetchStudents(markClass);
    }
  }, [markClass, fetchStudents]);

  // ---- Save subject attendance ----
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
      // Use POST for each student with individual status
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

  // ---- Apply leave ----
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

  // ---- Status badge helper ----
  const statusBadge = (status: string) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      PRESENT: { variant: "default", className: "bg-green-600 hover:bg-green-700 text-white" },
      ABSENT: { variant: "destructive", className: "" },
      LEAVE: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
      HOLIDAY: { variant: "secondary", className: "bg-purple-500 hover:bg-purple-600 text-white" },
      NO_CLASS: { variant: "outline", className: "" },
      PENDING: { variant: "secondary", className: "bg-yellow-500 hover:bg-yellow-600 text-white" },
      APPROVED: { variant: "default", className: "bg-green-600 hover:bg-green-700 text-white" },
      REJECTED: { variant: "destructive", className: "" },
    };
    const config = map[status] || { variant: "outline" as const, className: "" };
    return (
      <Badge variant={config.variant} className={cn("text-xs", config.className)}>
        {status}
      </Badge>
    );
  };

  // ---- Format check-in/out time ----
  const formatCheckTime = (isoString: string | null) => {
    if (!isoString) return "—";
    try {
      return format(new Date(isoString), "hh:mm a");
    } catch {
      return "—";
    }
  };

  // ---- Format date display ----
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  // ---- Parse holiday classes ----
  const parseHolidayClasses = (classes: string[] | string): string[] => {
    if (Array.isArray(classes)) return classes;
    try {
      return JSON.parse(classes);
    } catch {
      return ["ALL"];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              SA
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Sankalp Attendance</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 sm:py-6">
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="w-full flex flex-wrap mb-4">
            <TabsTrigger value="attendance" className="flex-1 min-w-0 gap-1.5">
              <ClipboardCheck className="size-4" />
              <span className="hidden sm:inline">Attendance</span>
              <span className="sm:hidden">Att.</span>
            </TabsTrigger>
            <TabsTrigger value="mark" className="flex-1 min-w-0 gap-1.5">
              <CalendarDays className="size-4" />
              <span className="hidden sm:inline">Mark Attendance</span>
              <span className="sm:hidden">Mark</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex-1 min-w-0 gap-1.5">
              <Plane className="size-4" />
              <span>Leave</span>
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex-1 min-w-0 gap-1.5">
              <PartyPopper className="size-4" />
              <span className="hidden sm:inline">Holidays</span>
              <span className="sm:hidden">Hol.</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== ATTENDANCE TAB ===== */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>My Attendance History</CardTitle>
                <CardDescription>View your check-in/check-out records</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Date range filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Label htmlFor="att-start" className="text-sm whitespace-nowrap">From</Label>
                    <Popover open={attStartPickerOpen} onOpenChange={setAttStartPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="att-start">
                          <CalendarDays className="size-4 mr-2" />
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
                    <Label htmlFor="att-end" className="text-sm whitespace-nowrap">To</Label>
                    <Popover open={attEndPickerOpen} onOpenChange={setAttEndPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" id="att-end">
                          <CalendarDays className="size-4 mr-2" />
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
                  <Button onClick={fetchAttendance} variant="secondary" size="default" className="gap-2">
                    <Loader2 className={cn("size-4", attendanceLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>

                {/* Attendance table */}
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardCheck className="size-10 mx-auto mb-2 opacity-40" />
                    <p>No attendance records found for this period</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Check-In</TableHead>
                          <TableHead>Check-Out</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== MARK ATTENDANCE TAB ===== */}
          <TabsContent value="mark">
            <Card>
              <CardHeader>
                <CardTitle>Mark Subject Attendance</CardTitle>
                <CardDescription>
                  Select date, subject, and class, then mark attendance for each student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover open={markDatePickerOpen} onOpenChange={setMarkDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarDays className="size-4 mr-2" />
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
                    <Label>Subject</Label>
                    <Select value={markSubject} onValueChange={setMarkSubject}>
                      <SelectTrigger className="w-full">
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
                    <Label>Class</Label>
                    <Select value={markClass} onValueChange={(val) => { setMarkClass(val); setStudentStatuses({}); }}>
                      <SelectTrigger className="w-full">
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
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading students...</span>
                  </div>
                ) : markClass && students.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardCheck className="size-10 mx-auto mb-2 opacity-40" />
                    <p>No students found in {markClass}</p>
                  </div>
                ) : !markClass ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="size-10 mx-auto mb-2 opacity-40" />
                    <p>Select a class to see students</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student, idx) => (
                            <TableRow key={student.userId}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">{student.userId}</TableCell>
                              <TableCell>
                                <Select
                                  value={studentStatuses[student.userId] || SUBJECT_ATTENDANCE_STATUS.PRESENT}
                                  onValueChange={(val) =>
                                    setStudentStatuses((prev) => ({ ...prev, [student.userId]: val }))
                                  }
                                >
                                  <SelectTrigger className="w-[130px]">
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

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={markSaving}
                        className="gap-2 min-w-[140px]"
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

          {/* ===== LEAVE TAB ===== */}
          <TabsContent value="leave">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>My Leave Requests</CardTitle>
                    <CardDescription>View and apply for leave</CardDescription>
                  </div>
                  <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="size-4" />
                        Apply Leave
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for Leave</DialogTitle>
                        <DialogDescription>
                          Select the date range and provide a remark for your leave request
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>From Date</Label>
                          <Popover open={leaveFromPickerOpen} onOpenChange={setLeaveFromPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarDays className="size-4 mr-2" />
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
                          <Label>To Date</Label>
                          <Popover open={leaveToPickerOpen} onOpenChange={setLeaveToPickerOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarDays className="size-4 mr-2" />
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
                          <Label htmlFor="leave-remark">Remark</Label>
                          <Input
                            id="leave-remark"
                            placeholder="Reason for leave (optional)"
                            value={leaveRemark}
                            onChange={(e) => setLeaveRemark(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleApplyLeave} disabled={leaveSubmitting} className="gap-2">
                          {leaveSubmitting && <Loader2 className="size-4 animate-spin" />}
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {leaveLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plane className="size-10 mx-auto mb-2 opacity-40" />
                    <p>No leave requests found</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Remark</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveRequests.map((leave) => (
                          <TableRow key={leave.id}>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== HOLIDAYS TAB ===== */}
          <TabsContent value="holidays">
            <Card>
              <CardHeader>
                <CardTitle>Holidays</CardTitle>
                <CardDescription>List of upcoming and past holidays</CardDescription>
              </CardHeader>
              <CardContent>
                {holidaysLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <PartyPopper className="size-10 mx-auto mb-2 opacity-40" />
                    <p>No holidays found</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Remark</TableHead>
                          <TableHead>Applicable Classes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holidays.map((holiday) => {
                          const classes = parseHolidayClasses(holiday.classes);
                          return (
                            <TableRow key={holiday.id}>
                              <TableCell className="font-medium">
                                {formatDateDisplay(holiday.date)}
                              </TableCell>
                              <TableCell>{holiday.remark || "—"}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {classes.map((cls) => (
                                    <Badge key={cls} variant="outline" className="text-xs">
                                      {cls}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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
