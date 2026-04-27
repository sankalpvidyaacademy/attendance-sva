"use client";

import { useState, useEffect, useCallback } from "react";
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

// ---------- Subject Attendance Record Type ----------
interface SubjectAttendanceRecord {
  id: string;
  userId: string;
  date: string;
  subject: string;
  status: string;
  markedBy: string | null;
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

export function StudentDashboard({ user }: StudentDashboardProps) {
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

  // ---- Subject attendance state ----
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [subjectRecords, setSubjectRecords] = useState<SubjectAttendanceRecord[]>([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  // ---- Monthly summary state ----
  const [summaryMonth, setSummaryMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    present: number;
    absent: number;
    leave: number;
    holiday: number;
  }>({ present: 0, absent: 0, leave: 0, holiday: 0 });

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
  const [subjectDatePickerOpen, setSubjectDatePickerOpen] = useState(false);
  const [leaveFromPickerOpen, setLeaveFromPickerOpen] = useState(false);
  const [leaveToPickerOpen, setLeaveToPickerOpen] = useState(false);

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

  // ---- Fetch subject attendance for selected date ----
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

  // ---- Fetch monthly summary ----
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const startDate = `${summaryMonth}-01`;
      const [year, mon] = summaryMonth.split("-").map(Number);
      const nextMonth = mon === 12 ? 1 : mon + 1;
      const nextYear = mon === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

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

  // ---- Effects ----
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    fetchSubjectAttendance();
  }, [fetchSubjectAttendance]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

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
              <p className="text-xs text-muted-foreground">
                Welcome, {user.name}
                {user.class && (
                  <span className="ml-1 text-muted-foreground">({user.class})</span>
                )}
              </p>
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
              <span>Attendance</span>
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
            <div className="space-y-6">
              {/* Attendance History Card */}
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
                    <div className="rounded-md border max-h-[400px] overflow-y-auto">
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

              {/* Subject-wise Attendance Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Subject-wise Attendance</CardTitle>
                      <CardDescription>Select a date to see subject attendance</CardDescription>
                    </div>
                    <Popover open={subjectDatePickerOpen} onOpenChange={setSubjectDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal gap-2">
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
                <CardContent>
                  {subjectLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : subjectRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardCheck className="size-8 mx-auto mb-2 opacity-40" />
                      <p>No subject attendance records for {formatDateDisplay(selectedDate)}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjectRecords.map((record) => (
                            <TableRow key={record.id}>
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

              {/* Monthly Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="size-5" />
                        Monthly Summary
                      </CardTitle>
                      <CardDescription>Attendance breakdown for the selected month</CardDescription>
                    </div>
                    <Input
                      type="month"
                      value={summaryMonth}
                      onChange={(e) => setSummaryMonth(e.target.value)}
                      className="w-full sm:w-44"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{summaryData.present}</p>
                        <p className="text-sm text-muted-foreground mt-1">Present</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-red-600">{summaryData.absent}</p>
                        <p className="text-sm text-muted-foreground mt-1">Absent</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-600">{summaryData.leave}</p>
                        <p className="text-sm text-muted-foreground mt-1">Leave</p>
                      </div>
                      <div className="rounded-lg border p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">{summaryData.holiday}</p>
                        <p className="text-sm text-muted-foreground mt-1">Holiday</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                <CardDescription>
                  Holidays applicable to your class
                  {user.class && <span className="ml-1 font-medium">({user.class})</span>}
                </CardDescription>
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
