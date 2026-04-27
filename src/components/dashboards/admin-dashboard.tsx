"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { CLASSES, CLASS_SUBJECTS } from "@/lib/constants";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  LogOut,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  QrCode,
  Search,
  Users,
  GraduationCap,
  ScanLine,
  IdCard,
  CalendarDays,
  FileBarChart,
  Settings,
  ChevronDown,
  Download,
  X,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  Coffee,
  Sparkles,
  BookOpen,
} from "lucide-react";

import type { AuthUser } from "@/stores/auth-store";

// ─── Color Theme Constants ──────────────────────────────────────────────────

const THEME = {
  primary: "#2F2FE4",
  secondary: "#162E93",
  accent: "#1A1953",
  dark: "#080616",
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentOrTeacher {
  id: string;
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  subjects?: string[] | null;
  phone?: string | null;
  chatId?: string | null;
  plainPassword?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeaveRequestItem {
  id: string;
  userId: string;
  fromDate: string;
  toDate: string;
  remark?: string | null;
  status: string;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    userId: string;
    role: string;
    class?: string | null;
  };
}

interface HolidayItem {
  id: string;
  date: string;
  classes: string[];
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SettingsData {
  id: string;
  timezone: string;
  timeFormat: string;
  telegramBotToken?: string | null;
  dailyReportEnabled: boolean;
  dailyReportTime: string;
}

interface SubjectStatus {
  subject: string;
  status: string;
}

interface QRLogItem {
  userId: string;
  name: string;
  role: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
}

interface DailyReportRecord {
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  subjects: SubjectStatus[];
}

interface DailyReportData {
  date: string;
  timezone?: string;
  isHoliday: boolean;
  holidayRemark?: string | null;
  summary: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    holiday: number;
  };
  qrLogs: QRLogItem[];
  studentReport: DailyReportRecord[];
  teacherReport: DailyReportRecord[];
}

interface MonthlyReportRecord {
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    leave: number;
    holiday: number;
  };
  subjectSummary: Record<
    string,
    { present: number; absent: number; leave: number; holiday: number; noClass?: number }
  >;
  dailyStatus: Record<
    string,
    { status: string; checkIn?: string | null; checkOut?: string | null }
  >;
  qrLogs?: { date: string; checkIn?: string | null; checkOut?: string | null }[];
}

interface MonthlyReportData {
  month: string;
  timezone?: string;
  studentReport: MonthlyReportRecord[];
  teacherReport: MonthlyReportRecord[];
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  lastScanAt?: string | null;
  user: {
    name: string;
    userId: string;
    role: string;
    class?: string | null;
  };
}

interface IDCardData {
  user: {
    name: string;
    userId: string;
    password: string;
    class?: string | null;
    subjects: string[];
    role: string;
  };
  qrCodeDataUrl: string;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export default function AdminDashboard({ user: userProp }: { user: AuthUser }) {
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState("students");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: THEME.dark }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-white/10"
        style={{
          background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.secondary})`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl p-1.5"
              style={{ background: THEME.primary }}
            >
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Sankalp Attendance
              </h1>
              <p className="text-[10px] text-white/50 hidden sm:block">
                Management Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-sm text-white/80">{userProp.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10" style={{ background: THEME.accent }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-2">
            <TabsList className="h-auto flex w-full overflow-x-auto gap-1 p-1.5 bg-transparent justify-start">
              <TabsTrigger
                value="students"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <Users className="h-3.5 w-3.5" />
                Students
              </TabsTrigger>
              <TabsTrigger
                value="teachers"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                Teachers
              </TabsTrigger>
              <TabsTrigger
                value="scanner"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <ScanLine className="h-3.5 w-3.5" />
                Scanner
              </TabsTrigger>
              <TabsTrigger
                value="idcards"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <IdCard className="h-3.5 w-3.5" />
                ID Cards
              </TabsTrigger>
              <TabsTrigger
                value="leave"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <Clock className="h-3.5 w-3.5" />
                Leave
              </TabsTrigger>
              <TabsTrigger
                value="holidays"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Holidays
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <FileBarChart className="h-3.5 w-3.5" />
                Reports
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 data-[state=active]:shadow-lg rounded-lg px-3 py-2"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Students Tab ──────────────────────────────────────── */}
          <TabsContent value="students" className="flex-1 p-4">
            <StudentsTab />
          </TabsContent>

          {/* ── Teachers Tab ──────────────────────────────────────── */}
          <TabsContent value="teachers" className="flex-1 p-4">
            <TeachersTab />
          </TabsContent>

          {/* ── QR Scanner Tab ────────────────────────────────────── */}
          <TabsContent value="scanner" className="flex-1 p-4">
            <QRScannerTab />
          </TabsContent>

          {/* ── ID Cards Tab ──────────────────────────────────────── */}
          <TabsContent value="idcards" className="flex-1 p-4">
            <IDCardsTab />
          </TabsContent>

          {/* ── Leave Tab ─────────────────────────────────────────── */}
          <TabsContent value="leave" className="flex-1 p-4">
            <LeaveTab adminUserId={userProp.userId} />
          </TabsContent>

          {/* ── Holidays Tab ──────────────────────────────────────── */}
          <TabsContent value="holidays" className="flex-1 p-4">
            <HolidaysTab />
          </TabsContent>

          {/* ── Reports Tab ───────────────────────────────────────── */}
          <TabsContent value="reports" className="flex-1 p-4">
            <ReportsTab />
          </TabsContent>

          {/* ── Settings Tab ──────────────────────────────────────── */}
          <TabsContent value="settings" className="flex-1 p-4">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateStr(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTimeStr(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "-";
  }
}

function getSubjectsForClass(className: string): string[] {
  return CLASS_SUBJECTS[className] || [];
}

function getAllSubjectsForClasses(classNames: string[]): string[] {
  const subjectSet = new Set<string>();
  for (const cn of classNames) {
    const subs = CLASS_SUBJECTS[cn] || [];
    subs.forEach((s) => subjectSet.add(s));
  }
  return Array.from(subjectSet).sort();
}

function getStatusBadge(status: string) {
  const colorMap: Record<string, string> = {
    PRESENT: "bg-green-500/20 text-green-400 border-green-500/30",
    ABSENT: "bg-red-500/20 text-red-400 border-red-500/30",
    LEAVE: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    HOLIDAY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
    REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
    NO_CLASS: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const cls = colorMap[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return (
    <Badge className={`${cls} rounded-full border text-[10px] font-semibold px-2.5 py-0.5`} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  );
}

// ─── Styled Card Wrapper ─────────────────────────────────────────────────────

function ThemedCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`bg-white/5 border-white/10 text-white backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

// ─── Students Tab ────────────────────────────────────────────────────────────

function StudentsTab() {
  const [students, setStudents] = useState<StudentOrTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentOrTeacher | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentOrTeacher | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{
    userId: string;
    plainPassword: string;
    name: string;
  } | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "STUDENT" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAdd = () => {
    setEditStudent(null);
    setShowAddDialog(true);
  };

  const handleEdit = (student: StudentOrTeacher) => {
    setEditStudent(student);
    setShowAddDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteStudent) return;
    try {
      const res = await fetch(`/api/users/${deleteStudent.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Student deleted successfully");
        setDeleteStudent(null);
        fetchStudents();
      } else {
        toast.error("Failed to delete student");
      }
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    class: string;
    subjects: string[];
    phone: string;
  }) => {
    try {
      if (editStudent) {
        const res = await fetch(`/api/users/${editStudent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            class: data.class,
            subjects: data.subjects,
            phone: data.phone || null,
          }),
        });
        if (res.ok) {
          toast.success("Student updated successfully");
          setShowAddDialog(false);
          setEditStudent(null);
          fetchStudents();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to update student");
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            role: "STUDENT",
            class: data.class,
            subjects: data.subjects,
            phone: data.phone || null,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          setCreatedCredentials({
            userId: result.userId,
            plainPassword: result.plainPassword,
            name: result.name,
          });
          setShowAddDialog(false);
          fetchStudents();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to create student");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#2F2FE4]"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Student
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : students.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No students found. Click &quot;Add Student&quot; to create one.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <ThemedCard key={s.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{s.name}</div>
                    <div className="text-sm text-white/50 mt-0.5">
                      ID: <span className="font-mono text-white/70">{s.userId}</span>
                    </div>
                    <div className="text-sm text-white/50">
                      Class: <span className="text-white/70">{s.class || "-"}</span>
                    </div>
                    {s.subjects && Array.isArray(s.subjects) && s.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.subjects.map((sub) => (
                          <Badge
                            key={sub}
                            variant="outline"
                            className="text-[10px] bg-[#2F2FE4]/20 text-[#2F2FE4] border-[#2F2FE4]/30 rounded-full px-2"
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {s.phone && (
                      <div className="text-sm text-white/50 mt-1">
                        Phone: <span className="text-white/70">{s.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-white/40">Password:</span>
                      <span className="text-xs font-mono text-white/80">
                        {visiblePasswords[s.userId]
                          ? s.plainPassword || "Not available"
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 min-h-[28px] min-w-[28px] hover:bg-white/10 text-white/50 hover:text-white/80"
                        onClick={() => togglePasswordVisibility(s.userId)}
                      >
                        {visiblePasswords[s.userId] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10 hover:text-white min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => handleEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => setDeleteStudent(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* Add/Edit Student Dialog */}
      <StudentFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        student={editStudent}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteStudent?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStudent(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created Credentials Dialog */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={() => setCreatedCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Created Successfully</DialogTitle>
            <DialogDescription>
              Please note down the credentials. The password will not be shown
              again.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">Name: </span>
                <span className="text-sm">{createdCredentials.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium">User ID: </span>
                <span className="text-sm font-mono">
                  {createdCredentials.userId}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Password: </span>
                <span className="text-sm font-mono">
                  {createdCredentials.plainPassword}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Student Form Dialog ─────────────────────────────────────────────────────

function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOrTeacher | null;
  onSubmit: (data: { name: string; class: string; subjects: string[]; phone: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <StudentFormContent student={student} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StudentFormContent({
  student,
  onSubmit,
  onCancel,
}: {
  student: StudentOrTeacher | null;
  onSubmit: (data: { name: string; class: string; subjects: string[]; phone: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(student?.name || "");
  const [className, setClassName] = useState(student?.class || "");
  const [subjects, setSubjects] = useState<string[]>(
    Array.isArray(student?.subjects) ? student.subjects : []
  );
  const [phone, setPhone] = useState(student?.phone || "");
  const [saving, setSaving] = useState(false);

  const availableSubjects = className ? getSubjectsForClass(className) : [];

  const handleClassChange = (val: string) => {
    setClassName(val);
    const newSubjects = getSubjectsForClass(val);
    setSubjects(subjects.filter((s) => newSubjects.includes(s)));
  };

  const toggleSubject = (sub: string) => {
    setSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!className) {
      toast.error("Class is required");
      return;
    }
    setSaving(true);
    await onSubmit({ name: name.trim(), class: className, subjects, phone: phone.trim() });
    setSaving(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {student ? "Edit Student" : "Add Student"}
        </DialogTitle>
        <DialogDescription>
          {student
            ? "Update student details below."
            : "Fill in the details to create a new student."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="student-name">Name *</Label>
          <Input
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student name"
          />
        </div>
        <div className="space-y-2">
          <Label>Class *</Label>
          <Select value={className} onValueChange={handleClassChange}>
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
        {availableSubjects.length > 0 && (
          <div className="space-y-2">
            <Label>Subjects</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              {availableSubjects.map((sub) => (
                <div key={sub} className="flex items-center gap-2">
                  <Checkbox
                    id={`sub-${sub}`}
                    checked={subjects.includes(sub)}
                    onCheckedChange={() => toggleSubject(sub)}
                  />
                  <Label
                    htmlFor={`sub-${sub}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sub}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="student-phone">Phone (optional)</Label>
          <Input
            id="student-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {student ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Teachers Tab ────────────────────────────────────────────────────────────

function TeachersTab() {
  const [teachers, setTeachers] = useState<StudentOrTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTeacher, setEditTeacher] = useState<StudentOrTeacher | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<StudentOrTeacher | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{
    userId: string;
    plainPassword: string;
    name: string;
  } | null>(null);
  const [markingOff, setMarkingOff] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "TEACHER" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAdd = () => {
    setEditTeacher(null);
    setShowAddDialog(true);
  };

  const handleEdit = (teacher: StudentOrTeacher) => {
    setEditTeacher(teacher);
    setShowAddDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTeacher) return;
    try {
      const res = await fetch(`/api/users/${deleteTeacher.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Teacher deleted successfully");
        setDeleteTeacher(null);
        fetchTeachers();
      } else {
        toast.error("Failed to delete teacher");
      }
    } catch {
      toast.error("Failed to delete teacher");
    }
  };

  const handleMarkClassOff = async (teacher: StudentOrTeacher) => {
    setMarkingOff(teacher.id);
    try {
      const teacherSubjects = Array.isArray(teacher.subjects)
        ? teacher.subjects
        : [];
      const teacherClasses: string[] = [];

      for (const cls of CLASSES) {
        const classSubjects = CLASS_SUBJECTS[cls] || [];
        if (teacherSubjects.some((s) => classSubjects.includes(s))) {
          teacherClasses.push(cls);
        }
      }

      const today = new Date().toISOString().split("T")[0];

      for (const cls of teacherClasses) {
        const classSubjects = CLASS_SUBJECTS[cls] || [];
        const relevantSubjects = teacherSubjects.filter((s) =>
          classSubjects.includes(s)
        );

        await fetch("/api/subject-attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class: cls,
            date: today,
            subjects: relevantSubjects,
            status: "NO_CLASS",
            markedBy: teacher.userId,
          }),
        });
      }

      toast.success("Class marked as NO_CLASS for today");
    } catch {
      toast.error("Failed to mark class off");
    } finally {
      setMarkingOff(null);
    }
  };

  const handleFormSubmit = async (data: {
    name: string;
    classes: string[];
    subjects: string[];
    phone: string;
  }) => {
    try {
      if (editTeacher) {
        const res = await fetch(`/api/users/${editTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            subjects: data.subjects,
            phone: data.phone || null,
          }),
        });
        if (res.ok) {
          toast.success("Teacher updated successfully");
          setShowAddDialog(false);
          setEditTeacher(null);
          fetchTeachers();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to update teacher");
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            role: "TEACHER",
            subjects: data.subjects,
            phone: data.phone || null,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          setCreatedCredentials({
            userId: result.userId,
            plainPassword: result.plainPassword,
            name: result.name,
          });
          setShowAddDialog(false);
          fetchTeachers();
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to create teacher");
        }
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#2F2FE4]"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Teacher
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : teachers.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No teachers found. Click &quot;Add Teacher&quot; to create one.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {teachers.map((t) => (
            <ThemedCard key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{t.name}</div>
                    <div className="text-sm text-white/50 mt-0.5">
                      ID: <span className="font-mono text-white/70">{t.userId}</span>
                    </div>
                    {t.subjects && Array.isArray(t.subjects) && t.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.subjects.map((sub) => (
                          <Badge
                            key={sub}
                            variant="outline"
                            className="text-[10px] bg-[#2F2FE4]/20 text-[#2F2FE4] border-[#2F2FE4]/30 rounded-full px-2"
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-sm text-white/50 mt-1">
                        Phone: <span className="text-white/70">{t.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-white/40">Password:</span>
                      <span className="text-xs font-mono text-white/80">
                        {visiblePasswords[t.userId]
                          ? t.plainPassword || "Not available"
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 min-h-[28px] min-w-[28px] hover:bg-white/10 text-white/50 hover:text-white/80"
                        onClick={() => togglePasswordVisibility(t.userId)}
                      >
                        {visiblePasswords[t.userId] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 min-h-[44px] rounded-xl"
                      onClick={() => handleMarkClassOff(t)}
                      disabled={markingOff === t.id}
                    >
                      {markingOff === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1.5 text-xs">Mark Off</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10 hover:text-white min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => setDeleteTeacher(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* Add/Edit Teacher Dialog */}
      <TeacherFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        teacher={editTeacher}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTeacher} onOpenChange={() => setDeleteTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTeacher?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeacher(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created Credentials Dialog */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={() => setCreatedCredentials(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Created Successfully</DialogTitle>
            <DialogDescription>
              Please note down the credentials. The password will not be shown
              again.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div>
                <span className="text-sm font-medium">Name: </span>
                <span className="text-sm">{createdCredentials.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium">User ID: </span>
                <span className="text-sm font-mono">
                  {createdCredentials.userId}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Password: </span>
                <span className="text-sm font-mono">
                  {createdCredentials.plainPassword}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Teacher Form Dialog ─────────────────────────────────────────────────────

function deriveClassesFromSubjects(subjects: string[] | null): string[] {
  const subs = Array.isArray(subjects) ? subjects : [];
  const result: string[] = [];
  for (const cls of CLASSES) {
    const classSubjects = CLASS_SUBJECTS[cls] || [];
    if (subs.some((s) => classSubjects.includes(s))) {
      result.push(cls);
    }
  }
  return result;
}

function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: StudentOrTeacher | null;
  onSubmit: (data: {
    name: string;
    classes: string[];
    subjects: string[];
    phone: string;
  }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <TeacherFormContent teacher={teacher} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TeacherFormContent({
  teacher,
  onSubmit,
  onCancel,
}: {
  teacher: StudentOrTeacher | null;
  onSubmit: (data: {
    name: string;
    classes: string[];
    subjects: string[];
    phone: string;
  }) => void;
  onCancel: () => void;
}) {
  const initialClasses = deriveClassesFromSubjects(teacher?.subjects ?? null);
  const [name, setName] = useState(teacher?.name || "");
  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialClasses);
  const [subjects, setSubjects] = useState<string[]>(
    Array.isArray(teacher?.subjects) ? teacher.subjects : []
  );
  const [phone, setPhone] = useState(teacher?.phone || "");
  const [saving, setSaving] = useState(false);

  const availableSubjects = getAllSubjectsForClasses(selectedClasses);

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) => {
      const next = prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls];
      const validSubjects = getAllSubjectsForClasses(next);
      setSubjects((currentSubs) =>
        currentSubs.filter((s) => validSubjects.includes(s))
      );
      return next;
    });
  };

  const toggleSubject = (sub: string) => {
    setSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      classes: selectedClasses,
      subjects,
      phone: phone.trim(),
    });
    setSaving(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {teacher ? "Edit Teacher" : "Add Teacher"}
        </DialogTitle>
        <DialogDescription>
          {teacher
            ? "Update teacher details below."
            : "Fill in the details to create a new teacher."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teacher-name">Name *</Label>
          <Input
            id="teacher-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Teacher name"
          />
        </div>
        <div className="space-y-2">
          <Label>Classes</Label>
          <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
            {CLASSES.map((cls) => (
              <div key={cls} className="flex items-center gap-2">
                <Checkbox
                  id={`tcls-${cls}`}
                  checked={selectedClasses.includes(cls)}
                  onCheckedChange={() => toggleClass(cls)}
                />
                <Label
                  htmlFor={`tcls-${cls}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {cls}
                </Label>
              </div>
            ))}
          </div>
        </div>
        {availableSubjects.length > 0 && (
          <div className="space-y-2">
            <Label>Subjects</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              {availableSubjects.map((sub) => (
                <div key={sub} className="flex items-center gap-2">
                  <Checkbox
                    id={`tsub-${sub}`}
                    checked={subjects.includes(sub)}
                    onCheckedChange={() => toggleSubject(sub)}
                  />
                  <Label
                    htmlFor={`tsub-${sub}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sub}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="teacher-phone">Phone (optional)</Label>
          <Input
            id="teacher-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {teacher ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── QR Scanner Tab ──────────────────────────────────────────────────────────

function QRScannerTab() {
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: string;
    attendance: {
      id: string;
      userId: string;
      date: string;
      checkIn: string | null;
      checkOut: string | null;
      status: string;
    };
  } | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchTodayAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance?date=${today}`);
      const data = await res.json();
      setTodayAttendance(Array.isArray(data.records) ? data.records : []);
    } catch {
      // silently fail
    } finally {
      setLoadingAttendance(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleScan = async () => {
    if (!scanInput.trim()) {
      toast.error("Please enter a User ID");
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: scanInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
        toast.success(
          data.type === "checkIn"
            ? "Check-In successful!"
            : data.type === "checkOut"
              ? "Check-Out successful!"
              : "Attendance updated!"
        );
        setScanInput("");
        fetchTodayAttendance();
      } else {
        toast.error(data.error || "Scan failed");
      }
    } catch {
      toast.error("Failed to scan");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <ThemedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <QrCode className="h-5 w-5 text-[#2F2FE4]" /> QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">User ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter or scan User ID"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#2F2FE4]"
              />
              <Button
                onClick={handleScan}
                disabled={scanning}
                className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl min-w-[44px] min-h-[44px]"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-white/10 text-white/70 hover:bg-white/10 hover:text-white rounded-xl min-h-[44px]"
            onClick={() => setCameraOpen(!cameraOpen)}
          >
            <Camera className="h-4 w-4 mr-2" />
            {cameraOpen ? "Close Camera" : "Open Camera (Scan QR)"}
          </Button>
          {cameraOpen && (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <CameraView onScan={(code) => { setScanInput(code); setCameraOpen(false); }} />
            </div>
          )}
          {scanResult && (
            <ThemedCard className="bg-[#2F2FE4]/10 border-[#2F2FE4]/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {scanResult.type === "checkIn" ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-400" />
                  )}
                  <span className="font-medium text-white">
                    {scanResult.type === "checkIn"
                      ? "Check-In"
                      : scanResult.type === "checkOut"
                        ? "Check-Out"
                        : "Updated"}
                  </span>
                </div>
                <div className="text-sm text-white/70 space-y-1">
                  <div>
                    User ID:{" "}
                    <span className="font-mono text-white">
                      {scanResult.attendance.userId}
                    </span>
                  </div>
                  <div>Date: {scanResult.attendance.date}</div>
                  <div>
                    Check-In:{" "}
                    {formatTimeStr(scanResult.attendance.checkIn)}
                  </div>
                  <div>
                    Check-Out:{" "}
                    {formatTimeStr(scanResult.attendance.checkOut)}
                  </div>
                  <div className="pt-1">
                    Status: {getStatusBadge(scanResult.attendance.status)}
                  </div>
                </div>
              </CardContent>
            </ThemedCard>
          )}
        </CardContent>
      </ThemedCard>

      <ThemedCard>
        <CardHeader>
          <CardTitle className="text-base text-white">
            Today&apos;s Attendance ({formatDateStr(today)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : todayAttendance.length === 0 ? (
            <p className="text-white/40 text-center py-4">
              No attendance records for today.
            </p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/50">Name</TableHead>
                    <TableHead className="text-white/50">ID</TableHead>
                    <TableHead className="text-white/50">Check-In</TableHead>
                    <TableHead className="text-white/50">Check-Out</TableHead>
                    <TableHead className="text-white/50">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((rec) => (
                    <TableRow key={rec.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        {rec.user?.name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-white/70">
                        {rec.userId}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {formatTimeStr(rec.checkIn)}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {formatTimeStr(rec.checkOut)}
                      </TableCell>
                      <TableCell>{getStatusBadge(rec.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </ThemedCard>
    </div>
  );
}

// ─── Camera View (simplified) ────────────────────────────────────────────────

function CameraView({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError("Camera access denied or not available. Please type the User ID manually.");
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-white/40 bg-white/5">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-h-64 object-cover"
      />
      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <Button
          size="sm"
          variant="secondary"
          className="min-h-[44px] rounded-xl"
          onClick={() => {
            const code = window.prompt("Enter the scanned User ID:");
            if (code) onScan(code);
          }}
        >
          <QrCode className="h-4 w-4 mr-1" /> Manual Input from QR
        </Button>
      </div>
    </div>
  );
}

// ─── ID Cards Tab ────────────────────────────────────────────────────────────

function IDCardsTab() {
  const [users, setUsers] = useState<StudentOrTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<IDCardData | null>(null);
  const [loadingCard, setLoadingCard] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleGenerateCard = async (userId: string, id: string) => {
    setLoadingCard(id);
    try {
      const res = await fetch(`/api/id-card/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedCard(data);
      } else {
        toast.error(data.error || "Failed to generate ID card");
      }
    } catch {
      toast.error("Failed to generate ID card");
    } finally {
      setLoadingCard(null);
    }
  };

  const handleDownload = async () => {
    if (!selectedCard) return;

    const cardEl = document.getElementById("id-card-preview");
    if (!cardEl) return;

    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = 350 * scale;
      canvas.height = 500 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);
      ctx.fillStyle = "#080616";
      ctx.fillRect(0, 0, 350, 500);

      // Header gradient
      const gradient = ctx.createLinearGradient(0, 0, 350, 70);
      gradient.addColorStop(0, "#1A1953");
      gradient.addColorStop(1, "#2F2FE4");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 350, 70);

      // Header text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sankalp", 175, 40);

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(selectedCard.user.name, 175, 100);

      // Class
      if (selectedCard.user.class) {
        ctx.fillStyle = "#a0a0ff";
        ctx.font = "14px sans-serif";
        ctx.fillText(selectedCard.user.class, 175, 125);
      }

      // Subjects
      if (selectedCard.user.subjects.length > 0) {
        ctx.fillStyle = "#8080cc";
        ctx.font = "11px sans-serif";
        const subjectStr = selectedCard.user.subjects.join(", ");
        const words = subjectStr.split(", ");
        let line = "";
        let y = selectedCard.user.class ? 145 : 125;
        for (const word of words) {
          const testLine = line ? line + ", " + word : word;
          if (ctx.measureText(testLine).width > 300) {
            ctx.fillText(line, 175, y);
            line = word;
            y += 16;
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, 175, y);
          y += 16;
        }
      }

      // User ID
      ctx.fillStyle = "#ffffff";
      ctx.font = "13px monospace";
      ctx.fillText(`ID: ${selectedCard.user.userId}`, 175, 190);

      // Password
      ctx.fillStyle = "#a0a0ff";
      ctx.font = "12px monospace";
      ctx.fillText(`Password: ${selectedCard.user.password}`, 175, 215);

      // QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = selectedCard.qrCodeDataUrl;

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        setTimeout(() => reject(new Error("timeout")), 5000);
      });

      const qrSize = 180;
      const qrX = (350 - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, 240, qrSize, qrSize);

      // Footer
      ctx.fillStyle = "#6060a0";
      ctx.font = "10px sans-serif";
      ctx.fillText("Scan QR code to mark attendance", 175, 445);
      ctx.fillText("Sankalp Attendance Management", 175, 465);

      const link = document.createElement("a");
      link.download = `${selectedCard.user.name}_${selectedCard.user.userId}.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();

      toast.success("ID Card downloaded successfully");
    } catch {
      toast.error("Failed to download ID card. Try again.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.userId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#2F2FE4]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No users found.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <ThemedCard key={u.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{u.name}</div>
                  <div className="text-sm text-white/50">
                    {u.userId} &middot; <span className="text-[#2F2FE4]">{u.role}</span>
                    {u.class ? ` · ${u.class}` : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#2F2FE4]/30 text-[#2F2FE4] hover:bg-[#2F2FE4]/10 min-h-[44px] rounded-xl"
                  onClick={() => handleGenerateCard(u.userId, u.id)}
                  disabled={loadingCard === u.id}
                >
                  {loadingCard === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IdCard className="h-4 w-4" />
                  )}
                  <span className="ml-1.5">ID Card</span>
                </Button>
              </CardContent>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* ID Card Preview Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ID Card Preview</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="flex flex-col items-center">
              <div
                id="id-card-preview"
                className="w-[350px] rounded-2xl border-2 border-[#2F2FE4]/30 p-6 text-center"
                style={{ background: `linear-gradient(180deg, ${THEME.accent}, ${THEME.dark})` }}
              >
                <div className="text-2xl font-bold text-white mb-2">
                  Sankalp
                </div>
                <Separator className="my-2 bg-white/20" />
                <div className="text-lg font-semibold text-white">
                  {selectedCard.user.name}
                </div>
                {selectedCard.user.class && (
                  <div className="text-sm text-[#2F2FE4] mt-1">
                    {selectedCard.user.class}
                  </div>
                )}
                {selectedCard.user.subjects.length > 0 && (
                  <div className="text-xs text-white/50 mt-1">
                    {selectedCard.user.subjects.join(", ")}
                  </div>
                )}
                <div className="mt-3 text-sm font-mono text-white/80">
                  ID: {selectedCard.user.userId}
                </div>
                <div className="text-xs font-mono text-white/50">
                  Password: {selectedCard.user.password}
                </div>
                <div className="mt-4 flex justify-center">
                  <img
                    src={selectedCard.qrCodeDataUrl}
                    alt="QR Code"
                    className="w-44 h-44 rounded-lg"
                  />
                </div>
                <div className="mt-2 text-xs text-white/30">
                  Scan QR code to mark attendance
                </div>
                <div className="text-xs text-white/30">
                  Sankalp Attendance Management
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCard(null)}
            >
              Close
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white"
            >
              <Download className="h-4 w-4 mr-1" /> Download JPG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Leave Tab ───────────────────────────────────────────────────────────────

function LeaveTab({ adminUserId }: { adminUserId: string }) {
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/leave?${params.toString()}`);
      const data = await res.json();
      setLeaves(Array.isArray(data.leaveRequests) ? data.leaveRequests : []);
    } catch {
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleReview = async (
    id: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      const res = await fetch("/api/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewedBy: adminUserId }),
      });
      if (res.ok) {
        toast.success(
          status === "APPROVED"
            ? "Leave request approved"
            : "Leave request rejected"
        );
        fetchLeaves();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update leave request");
      }
    } catch {
      toast.error("Failed to update leave request");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-white/60 text-sm">Filter:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : leaves.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No leave requests found.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <ThemedCard key={leave.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{leave.user?.name || "-"}</div>
                    <div className="text-sm text-white/50">
                      ID: {leave.user?.userId} &middot; {leave.user?.role}
                      {leave.user?.class ? ` · ${leave.user.class}` : ""}
                    </div>
                    <div className="text-sm text-white/70 mt-1">
                      {formatDateStr(leave.fromDate)} →{" "}
                      {formatDateStr(leave.toDate)}
                    </div>
                    {leave.remark && (
                      <div className="text-sm text-white/40 mt-1">
                        {leave.remark}
                      </div>
                    )}
                    <div className="mt-2">{getStatusBadge(leave.status)}</div>
                  </div>
                  {leave.status === "PENDING" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl min-h-[44px] shadow-lg shadow-green-600/20"
                        onClick={() => handleReview(leave.id, "APPROVED")}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl min-h-[44px] shadow-lg"
                        onClick={() => handleReview(leave.id, "REJECTED")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </ThemedCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Holidays Tab ────────────────────────────────────────────────────────────

function HolidaysTab() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteHoliday, setDeleteHoliday] = useState<HolidayItem | null>(null);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/holidays");
      const data = await res.json();
      setHolidays(Array.isArray(data.holidays) ? data.holidays : []);
    } catch {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleDelete = async () => {
    if (!deleteHoliday) return;
    try {
      const res = await fetch(`/api/holidays?id=${deleteHoliday.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Holiday deleted successfully");
        setDeleteHoliday(null);
        fetchHolidays();
      } else {
        toast.error("Failed to delete holiday");
      }
    } catch {
      toast.error("Failed to delete holiday");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Holiday
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : holidays.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No holidays found. Click &quot;Add Holiday&quot; to create one.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {holidays.map((h) => (
            <ThemedCard key={h.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    {formatDateStr(h.date)}
                  </div>
                  {h.remark && (
                    <div className="text-sm text-white/50">
                      {h.remark}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.classes.map((cls) => (
                      <Badge
                        key={cls}
                        variant="outline"
                        className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30 rounded-full px-2"
                      >
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
                  onClick={() => setDeleteHoliday(h)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </ThemedCard>
          ))}
        </div>
      )}

      {/* Add Holiday Dialog */}
      <AddHolidayDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchHolidays();
        }}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteHoliday} onOpenChange={() => setDeleteHoliday(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Holiday</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the holiday on{" "}
              {deleteHoliday ? formatDateStr(deleteHoliday.date) : ""}? Attendance
              records will not be reverted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteHoliday(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Add Holiday Dialog ──────────────────────────────────────────────────────

function AddHolidayDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleClass = (cls: string) => {
    if (cls === "ALL") {
      setSelectedClasses((prev) =>
        prev.includes("ALL") ? prev.filter((c) => c !== "ALL") : ["ALL"]
      );
    } else {
      setSelectedClasses((prev) => {
        const withoutAll = prev.filter((c) => c !== "ALL");
        return withoutAll.includes(cls)
          ? withoutAll.filter((c) => c !== cls)
          : [...withoutAll, cls];
      });
    }
  };

  const handleSubmit = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (selectedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    setSaving(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          classes: selectedClasses,
          remark: remark.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Holiday added successfully");
        setDate(undefined);
        setSelectedClasses([]);
        setRemark("");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add holiday");
      }
    } catch {
      toast.error("Failed to add holiday");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Holiday</DialogTitle>
          <DialogDescription>Add a holiday for selected classes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? formatDateStr(date.toISOString().split("T")[0]) : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Classes *</Label>
            <div className="grid grid-cols-1 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hcls-ALL"
                  checked={selectedClasses.includes("ALL")}
                  onCheckedChange={() => toggleClass("ALL")}
                />
                <Label htmlFor="hcls-ALL" className="text-sm font-medium cursor-pointer">
                  All Classes
                </Label>
              </div>
              <Separator />
              {CLASSES.map((cls) => (
                <div key={cls} className="flex items-center gap-2">
                  <Checkbox
                    id={`hcls-${cls}`}
                    checked={selectedClasses.includes(cls)}
                    onCheckedChange={() => toggleClass(cls)}
                  />
                  <Label
                    htmlFor={`hcls-${cls}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {cls}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-remark">Remark (optional)</Label>
            <Input
              id="holiday-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Holiday remark"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Add Holiday
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────

function ReportsTab() {
  const [subTab, setSubTab] = useState("daily");

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger
            value="daily"
            className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg"
          >
            Monthly
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <DailyReport />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Daily Report ────────────────────────────────────────────────────────────

function DailyReport() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [className, setClassName] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportSection, setReportSection] = useState<string>("students");

  const generate = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    setLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const params = new URLSearchParams({ date: dateStr });
      if (className !== "ALL") params.set("class", className);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/reports/daily?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      } else {
        toast.error(data.error || "Failed to generate report");
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ThemedCard>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-white/60">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal border-white/10 text-white hover:bg-white/10"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {date
                      ? formatDateStr(date.toISOString().split("T")[0])
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generate}
              disabled={loading}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              <span className="ml-1.5">Generate</span>
            </Button>
          </div>
        </CardContent>
      </ThemedCard>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white/60" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{report.summary.total}</div>
                <div className="text-xs text-white/40">Total</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {report.summary.present}
                </div>
                <div className="text-xs text-white/40">Present</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-400">
                  {report.summary.absent}
                </div>
                <div className="text-xs text-white/40">Absent</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {report.summary.leave}
                </div>
                <div className="text-xs text-white/40">Leave</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-400">
                  {report.summary.holiday}
                </div>
                <div className="text-xs text-white/40">Holiday</div>
              </CardContent>
            </ThemedCard>
          </div>

          {report.isHoliday && report.holidayRemark && (
            <ThemedCard className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <span className="text-sm font-medium text-purple-300">Holiday: </span>
                <span className="text-sm text-purple-200">{report.holidayRemark}</span>
              </CardContent>
            </ThemedCard>
          )}

          {/* QR Logs Section */}
          {report.qrLogs && report.qrLogs.length > 0 && (
            <ThemedCard>
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-[#2F2FE4]" /> QR Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/50">Name</TableHead>
                        <TableHead className="text-white/50">Role</TableHead>
                        <TableHead className="text-white/50">Check-In</TableHead>
                        <TableHead className="text-white/50">Check-Out</TableHead>
                        <TableHead className="text-white/50">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.qrLogs.map((log, i) => (
                        <TableRow key={`${log.userId}-${i}`} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-medium text-white">{log.name}</TableCell>
                          <TableCell className="text-white/70 text-sm">{log.role}</TableCell>
                          <TableCell className="text-white/70 text-sm">{formatTimeStr(log.checkIn)}</TableCell>
                          <TableCell className="text-white/70 text-sm">{formatTimeStr(log.checkOut)}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </ThemedCard>
          )}

          {/* Report Sections Tabs */}
          {(report.studentReport.length > 0 || report.teacherReport.length > 0) && (
            <Tabs value={reportSection} onValueChange={setReportSection}>
              <TabsList className="bg-white/5 border border-white/10">
                {report.studentReport.length > 0 && (
                  <TabsTrigger
                    value="students"
                    className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg gap-1.5"
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Students ({report.studentReport.length})
                  </TabsTrigger>
                )}
                {report.teacherReport.length > 0 && (
                  <TabsTrigger
                    value="teachers"
                    className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" /> Teachers ({report.teacherReport.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {report.studentReport.length > 0 && (
                <TabsContent value="students">
                  <ThemedCard>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                              <TableHead className="text-white/50">Name</TableHead>
                              <TableHead className="text-white/50">ID</TableHead>
                              <TableHead className="text-white/50">Class</TableHead>
                              <TableHead className="text-white/50">Check-In</TableHead>
                              <TableHead className="text-white/50">Check-Out</TableHead>
                              <TableHead className="text-white/50">Status</TableHead>
                              <TableHead className="text-white/50">Subjects</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.studentReport.map((rec) => (
                              <TableRow key={rec.userId} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-medium text-white">{rec.name}</TableCell>
                                <TableCell className="font-mono text-xs text-white/70">{rec.userId}</TableCell>
                                <TableCell className="text-sm text-white/70">{rec.class || "-"}</TableCell>
                                <TableCell className="text-sm text-white/70">{formatTimeStr(rec.checkIn)}</TableCell>
                                <TableCell className="text-sm text-white/70">{formatTimeStr(rec.checkOut)}</TableCell>
                                <TableCell>{getStatusBadge(rec.status)}</TableCell>
                                <TableCell>
                                  {rec.subjects && rec.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-0.5">
                                      {rec.subjects.map((sub, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50"
                                          title={`${sub.subject}: ${sub.status}`}
                                        >
                                          {sub.subject.charAt(0)}
                                          <span className={`ml-0.5 ${
                                            sub.status === "PRESENT" ? "text-green-400" :
                                            sub.status === "ABSENT" ? "text-red-400" :
                                            sub.status === "LEAVE" ? "text-amber-400" :
                                            sub.status === "HOLIDAY" ? "text-purple-400" :
                                            sub.status === "NO_CLASS" ? "text-gray-400" :
                                            "text-white/40"
                                          }`}>
                                            {sub.status.charAt(0)}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </ThemedCard>
                </TabsContent>
              )}

              {report.teacherReport.length > 0 && (
                <TabsContent value="teachers">
                  <ThemedCard>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                              <TableHead className="text-white/50">Name</TableHead>
                              <TableHead className="text-white/50">ID</TableHead>
                              <TableHead className="text-white/50">Check-In</TableHead>
                              <TableHead className="text-white/50">Check-Out</TableHead>
                              <TableHead className="text-white/50">Status</TableHead>
                              <TableHead className="text-white/50">Subjects</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.teacherReport.map((rec) => (
                              <TableRow key={rec.userId} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-medium text-white">{rec.name}</TableCell>
                                <TableCell className="font-mono text-xs text-white/70">{rec.userId}</TableCell>
                                <TableCell className="text-sm text-white/70">{formatTimeStr(rec.checkIn)}</TableCell>
                                <TableCell className="text-sm text-white/70">{formatTimeStr(rec.checkOut)}</TableCell>
                                <TableCell>{getStatusBadge(rec.status)}</TableCell>
                                <TableCell>
                                  {rec.subjects && rec.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-0.5">
                                      {rec.subjects.map((sub, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/50"
                                          title={`${sub.subject}: ${sub.status}`}
                                        >
                                          {sub.subject.charAt(0)}
                                          <span className={`ml-0.5 ${
                                            sub.status === "PRESENT" ? "text-green-400" :
                                            sub.status === "ABSENT" ? "text-red-400" :
                                            sub.status === "NO_CLASS" ? "text-gray-400" :
                                            "text-white/40"
                                          }`}>
                                            {sub.status.charAt(0)}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-white/30">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </ThemedCard>
                </TabsContent>
              )}
            </Tabs>
          )}

          {report.studentReport.length === 0 && report.teacherReport.length === 0 && (
            <ThemedCard>
              <CardContent className="py-12 text-center text-white/40">
                No data found for the selected filters.
              </CardContent>
            </ThemedCard>
          )}
        </>
      )}
    </div>
  );
}

// ─── Monthly Report ──────────────────────────────────────────────────────────

function MonthlyReport() {
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [className, setClassName] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [reportSection, setReportSection] = useState<string>("students");

  const generate = async () => {
    if (!month) {
      toast.error("Please select a month");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (className !== "ALL") params.set("class", className);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/reports/monthly?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReport(data);
      } else {
        toast.error(data.error || "Failed to generate report");
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const renderUserCard = (rec: MonthlyReportRecord) => (
    <ThemedCard key={rec.userId}>
      <CardContent className="p-4">
        <Collapsible
          open={expandedUser === rec.userId}
          onOpenChange={() =>
            setExpandedUser(
              expandedUser === rec.userId ? null : rec.userId
            )
          }
        >
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="text-left min-w-0">
                <div className="font-semibold text-white">{rec.name}</div>
                <div className="text-sm text-white/50">
                  {rec.userId} &middot; {rec.class || "-"}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                    P:{rec.summary.present}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                    A:{rec.summary.absent}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                    L:{rec.summary.leave}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                    H:{rec.summary.holiday}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-white/50 transition-transform ${
                    expandedUser === rec.userId ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2 text-xs mt-2">
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                P:{rec.summary.present}
              </span>
              <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                A:{rec.summary.absent}
              </span>
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
                L:{rec.summary.leave}
              </span>
              <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                H:{rec.summary.holiday}
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator className="my-3 bg-white/10" />
            {/* Subject Summary */}
            {Object.keys(rec.subjectSummary).length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#2F2FE4]" /> Subject-wise Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(rec.subjectSummary).map(
                    ([subject, counts]) => (
                      <div
                        key={subject}
                        className="text-xs bg-white/5 border border-white/5 rounded-xl p-3"
                      >
                        <div className="font-semibold text-white/80 mb-2">{subject}</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            P:{counts.present}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            A:{counts.absent}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            L:{counts.leave}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            H:{counts.holiday}
                          </span>
                          {counts.noClass !== undefined && counts.noClass > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                              NC:{counts.noClass}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {/* QR Logs */}
            {rec.qrLogs && rec.qrLogs.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-white/80 mb-2 flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5 text-[#2F2FE4]" /> QR Logs
                </div>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {rec.qrLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-white/50 bg-white/5 rounded-lg px-3 py-1.5">
                        <span className="text-white/70">{log.date}</span>
                        <span>In: {formatTimeStr(log.checkIn)}</span>
                        <span>Out: {formatTimeStr(log.checkOut)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            {/* Daily Breakdown */}
            <div>
              <div className="text-sm font-medium text-white/80 mb-2">
                Daily Breakdown
              </div>
              <ScrollArea className="max-h-48">
                <div className="grid grid-cols-7 gap-1.5">
                  {Object.entries(rec.dailyStatus)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateStr, info]) => {
                      const day = dateStr.split("-")[2];
                      const statusColorMap: Record<string, string> = {
                        PRESENT: "bg-green-500/30 text-green-400 border-green-500/20",
                        ABSENT: "bg-red-500/30 text-red-400 border-red-500/20",
                        LEAVE: "bg-amber-500/30 text-amber-400 border-amber-500/20",
                        HOLIDAY: "bg-purple-500/30 text-purple-400 border-purple-500/20",
                        NO_CLASS: "bg-gray-500/30 text-gray-400 border-gray-500/20",
                      };
                      return (
                        <div
                          key={dateStr}
                          className={`text-center rounded-lg p-1.5 text-xs border ${
                            statusColorMap[info.status] || "bg-white/5 text-white/40 border-white/5"
                          }`}
                          title={`${dateStr}: ${info.status}${
                            info.checkIn ? ` (In: ${formatTimeStr(info.checkIn)})` : ""
                          }${
                            info.checkOut ? ` (Out: ${formatTimeStr(info.checkOut)})` : ""
                          }`}
                        >
                          <div className="font-semibold">{day}</div>
                          <div className="text-[10px] opacity-80">
                            {info.status === "PRESENT" ? "P" :
                             info.status === "ABSENT" ? "A" :
                             info.status === "LEAVE" ? "L" :
                             info.status === "HOLIDAY" ? "H" :
                             info.status === "NO_CLASS" ? "NC" : "?"}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </ThemedCard>
  );

  const allStudents = report?.studentReport ?? [];
  const allTeachers = report?.teacherReport ?? [];

  return (
    <div className="space-y-4">
      <ThemedCard>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-white/60">Month (YYYY-MM)</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-[#2F2FE4]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generate}
              disabled={loading}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              <span className="ml-1.5">Generate</span>
            </Button>
          </div>
        </CardContent>
      </ThemedCard>

      {report && (allStudents.length > 0 || allTeachers.length > 0) && (
        <Tabs value={reportSection} onValueChange={setReportSection}>
          <TabsList className="bg-white/5 border border-white/10">
            {allStudents.length > 0 && (
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg gap-1.5"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Students ({allStudents.length})
              </TabsTrigger>
            )}
            {allTeachers.length > 0 && (
              <TabsTrigger
                value="teachers"
                className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-white/60 rounded-lg gap-1.5"
              >
                <Users className="h-3.5 w-3.5" /> Teachers ({allTeachers.length})
              </TabsTrigger>
            )}
          </TabsList>

          {allStudents.length > 0 && (
            <TabsContent value="students">
              <div className="space-y-3">
                {allStudents.map(renderUserCard)}
              </div>
            </TabsContent>
          )}

          {allTeachers.length > 0 && (
            <TabsContent value="teachers">
              <div className="space-y-3">
                {allTeachers.map(renderUserCard)}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {report && allStudents.length === 0 && allTeachers.length === 0 && (
        <ThemedCard>
          <CardContent className="py-12 text-center text-white/40">
            No data found for the selected month/class.
          </CardContent>
        </ThemedCard>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [dailyReportEnabled, setDailyReportEnabled] = useState(false);
  const [dailyReportTime, setDailyReportTime] = useState("21:00");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setTimezone(data.settings.timezone || "Asia/Kolkata");
        setTimeFormat(data.settings.timeFormat || "12h");
        setTelegramBotToken(data.settings.telegramBotToken || "");
        setDailyReportEnabled(data.settings.dailyReportEnabled || false);
        setDailyReportTime(data.settings.dailyReportTime || "21:00");
      }
    } catch {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          timeFormat,
          telegramBotToken: telegramBotToken || null,
          dailyReportEnabled,
          dailyReportTime,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved successfully");
        fetchSettings();
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    "Asia/Kolkata",
    "Asia/Calcutta",
    "Asia/Colombo",
    "Asia/Dhaka",
    "Asia/Karachi",
    "Asia/Kathmandu",
    "UTC",
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <ThemedCard>
        <CardHeader>
          <CardTitle
            className="text-base text-white flex items-center gap-2"
            style={{ background: "transparent" }}
          >
            <Settings className="h-4 w-4 text-[#2F2FE4]" /> Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-white/70">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Format */}
          <div className="space-y-2">
            <Label className="text-white/70">Time Format</Label>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-white/10" />

          {/* Telegram Bot Token */}
          <div className="space-y-2">
            <Label className="text-white/70" htmlFor="telegram-token">Telegram Bot Token</Label>
            <Input
              id="telegram-token"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="Enter Telegram bot token"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#2F2FE4]"
            />
            <p className="text-xs text-white/40">
              Used for sending attendance notifications.
            </p>
          </div>

          <Separator className="bg-white/10" />

          {/* Daily Report Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white/70">Daily Report</Label>
              <p className="text-xs text-white/40">
                Send daily attendance report via Telegram
              </p>
            </div>
            <Switch
              checked={dailyReportEnabled}
              onCheckedChange={setDailyReportEnabled}
            />
          </div>

          {/* Daily Report Time */}
          {dailyReportEnabled && (
            <div className="space-y-2">
              <Label className="text-white/70" htmlFor="report-time">Daily Report Time</Label>
              <Input
                id="report-time"
                type="time"
                value={dailyReportTime}
                onChange={(e) => setDailyReportTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-[#2F2FE4]"
              />
            </div>
          )}

          <Separator className="bg-white/10" />

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </ThemedCard>
    </div>
  );
}
