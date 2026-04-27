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
} from "lucide-react";

import type { AuthUser } from "@/stores/auth-store";

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

interface DailyReportRecord {
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  holidayRemark?: string | null;
  subjects: { subject: string; status: string }[];
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
    { present: number; absent: number; leave: number; holiday: number }
  >;
  dailyStatus: Record<
    string,
    { status: string; checkIn?: string | null; checkOut?: string | null }
  >;
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">
              Sankalp Attendance
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userProp.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-2">
            <TabsList className="h-auto flex w-full overflow-x-auto gap-0 p-1 bg-transparent justify-start">
              <TabsTrigger value="students" className="gap-1 text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5" />
                Students
              </TabsTrigger>
              <TabsTrigger value="teachers" className="gap-1 text-xs sm:text-sm">
                <GraduationCap className="h-3.5 w-3.5" />
                Teachers
              </TabsTrigger>
              <TabsTrigger value="scanner" className="gap-1 text-xs sm:text-sm">
                <ScanLine className="h-3.5 w-3.5" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="idcards" className="gap-1 text-xs sm:text-sm">
                <IdCard className="h-3.5 w-3.5" />
                ID Cards
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-1 text-xs sm:text-sm">
                <Clock className="h-3.5 w-3.5" />
                Leave
              </TabsTrigger>
              <TabsTrigger value="holidays" className="gap-1 text-xs sm:text-sm">
                <CalendarDays className="h-3.5 w-3.5" />
                Holidays
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm">
                <FileBarChart className="h-3.5 w-3.5" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 text-xs sm:text-sm">
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
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PRESENT: "default",
    ABSENT: "destructive",
    LEAVE: "secondary",
    HOLIDAY: "outline",
    PENDING: "secondary",
    APPROVED: "default",
    REJECTED: "destructive",
    NO_CLASS: "outline",
  };
  const colorMap: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    APPROVED: "bg-green-100 text-green-800 hover:bg-green-100",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  if (colorMap[status]) {
    return (
      <Badge className={colorMap[status]}>{status}</Badge>
    );
  }
  return <Badge variant={map[status] || "outline"}>{status}</Badge>;
}

// ─── Students Tab ────────────────────────────────────────────────────────────

function StudentsTab() {
  const [students, setStudents] = useState<StudentOrTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentOrTeacher | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentOrTeacher | null>(null);
  const [passwordMap, setPasswordMap] = useState<Record<string, string>>({});
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
          setPasswordMap((prev) => ({
            ...prev,
            [result.userId]: result.plainPassword,
          }));
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

  const getPassword = (userId: string): string => {
    return passwordMap[userId] || "••••••••";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Student
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No students found. Click &quot;Add Student&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {s.userId}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Class: {s.class || "-"}
                    </div>
                    {s.subjects && Array.isArray(s.subjects) && s.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.subjects.map((sub) => (
                          <Badge key={sub} variant="outline" className="text-xs">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {s.phone && (
                      <div className="text-sm text-muted-foreground">
                        Phone: {s.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <span className="text-xs font-mono">
                        {visiblePasswords[s.userId]
                          ? getPassword(s.userId)
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(s.userId)}
                      >
                        {visiblePasswords[s.userId] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteStudent(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
  const [passwordMap, setPasswordMap] = useState<Record<string, string>>({});
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

      // Figure out classes from subjects
      for (const cls of CLASSES) {
        const classSubjects = CLASS_SUBJECTS[cls] || [];
        if (teacherSubjects.some((s) => classSubjects.includes(s))) {
          teacherClasses.push(cls);
        }
      }

      const today = new Date().toISOString().split("T")[0];

      // Get students in those classes
      for (const cls of teacherClasses) {
        const studentsRes = await fetch(`/api/users?role=STUDENT&class=${encodeURIComponent(cls)}`);
        const studentsData = await studentsRes.json();
        const studentList: StudentOrTeacher[] = Array.isArray(studentsData)
          ? studentsData
          : [];

        // Mark NO_CLASS for each student in each subject this teacher teaches for this class
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
          setPasswordMap((prev) => ({
            ...prev,
            [result.userId]: result.plainPassword,
          }));
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

  const getPassword = (userId: string): string => {
    return passwordMap[userId] || "••••••••";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Teacher
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No teachers found. Click &quot;Add Teacher&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teachers.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {t.userId}
                    </div>
                    {t.subjects && Array.isArray(t.subjects) && t.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.subjects.map((sub) => (
                          <Badge key={sub} variant="outline" className="text-xs">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-sm text-muted-foreground">
                        Phone: {t.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <span className="text-xs font-mono">
                        {visiblePasswords[t.userId]
                          ? getPassword(t.userId)
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(t.userId)}
                      >
                        {visiblePasswords[t.userId] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkClassOff(t)}
                      disabled={markingOff === t.id}
                    >
                      {markingOff === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1 text-xs">Mark Off</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTeacher(t)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      // Update subjects to only keep those valid for selected classes
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scan-input">User ID</Label>
            <div className="flex gap-2">
              <Input
                id="scan-input"
                placeholder="Enter or scan User ID"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
              />
              <Button onClick={handleScan} disabled={scanning}>
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
            className="w-full"
            onClick={() => setCameraOpen(!cameraOpen)}
          >
            <Camera className="h-4 w-4 mr-2" />
            {cameraOpen ? "Close Camera" : "Open Camera (Scan QR)"}
          </Button>
          {cameraOpen && (
            <div className="rounded-lg border overflow-hidden">
              <CameraView onScan={(code) => { setScanInput(code); setCameraOpen(false); }} />
            </div>
          )}
          {scanResult && (
            <Card className="bg-muted">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {scanResult.type === "checkIn" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                  <span className="font-medium">
                    {scanResult.type === "checkIn"
                      ? "Check-In"
                      : scanResult.type === "checkOut"
                        ? "Check-Out"
                        : "Updated"}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    User ID:{" "}
                    <span className="font-mono">
                      {scanResult.attendance.userId}
                    </span>
                  </div>
                  <div>
                    Date: {scanResult.attendance.date}
                  </div>
                  <div>
                    Check-In:{" "}
                    {formatTimeStr(scanResult.attendance.checkIn)}
                  </div>
                  <div>
                    Check-Out:{" "}
                    {formatTimeStr(scanResult.attendance.checkOut)}
                  </div>
                  <div>
                    Status: {getStatusBadge(scanResult.attendance.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Today&apos;s Attendance ({formatDateStr(today)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : todayAttendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No attendance records for today.
            </p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Check-In</TableHead>
                    <TableHead>Check-Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">
                        {rec.user?.name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {rec.userId}
                      </TableCell>
                      <TableCell>
                        {formatTimeStr(rec.checkIn)}
                      </TableCell>
                      <TableCell>
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
      </Card>
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
      } catch (err) {
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
      <div className="p-4 text-center text-sm text-muted-foreground bg-muted">
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
          onClick={() => {
            // In a real app, we'd use a QR scanning library here
            // For now, simulate by prompting
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
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 350, 500);

      // Header
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sankalp", 175, 40);

      // Name
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(selectedCard.user.name, 175, 80);

      // Class
      if (selectedCard.user.class) {
        ctx.fillStyle = "#475569";
        ctx.font = "14px sans-serif";
        ctx.fillText(selectedCard.user.class, 175, 105);
      }

      // Subjects
      if (selectedCard.user.subjects.length > 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "11px sans-serif";
        const subjectStr = selectedCard.user.subjects.join(", ");
        // Word wrap
        const words = subjectStr.split(", ");
        let line = "";
        let y = selectedCard.user.class ? 125 : 105;
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
      ctx.fillStyle = "#1e293b";
      ctx.font = "13px monospace";
      ctx.fillText(`ID: ${selectedCard.user.userId}`, 175, 170);

      // Password
      ctx.fillStyle = "#475569";
      ctx.font = "12px monospace";
      ctx.fillText(`Password: ${selectedCard.user.password}`, 175, 195);

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
      ctx.drawImage(qrImg, qrX, 220, qrSize, qrSize);

      // Footer
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      ctx.fillText("Scan QR code to mark attendance", 175, 430);
      ctx.fillText("Sankalp Attendance Management", 175, 450);

      // Download
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
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No users found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {u.userId} &middot; {u.role}
                    {u.class ? ` · ${u.class}` : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateCard(u.userId, u.id)}
                  disabled={loadingCard === u.id}
                >
                  {loadingCard === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IdCard className="h-4 w-4" />
                  )}
                  <span className="ml-1">ID Card</span>
                </Button>
              </CardContent>
            </Card>
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
                className="w-[350px] bg-white rounded-xl border shadow-lg p-6 text-center"
              >
                <div className="text-2xl font-bold text-slate-800 mb-2">
                  Sankalp
                </div>
                <Separator className="my-2" />
                <div className="text-lg font-semibold text-slate-900">
                  {selectedCard.user.name}
                </div>
                {selectedCard.user.class && (
                  <div className="text-sm text-slate-600 mt-1">
                    {selectedCard.user.class}
                  </div>
                )}
                {selectedCard.user.subjects.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedCard.user.subjects.join(", ")}
                  </div>
                )}
                <div className="mt-3 text-sm font-mono text-slate-700">
                  ID: {selectedCard.user.userId}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Password: {selectedCard.user.password}
                </div>
                <div className="mt-4 flex justify-center">
                  <img
                    src={selectedCard.qrCodeDataUrl}
                    alt="QR Code"
                    className="w-44 h-44"
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Scan QR code to mark attendance
                </div>
                <div className="text-xs text-slate-400">
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
            <Button onClick={handleDownload}>
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
        <Label className="text-sm">Filter:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
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
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : leaves.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No leave requests found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <Card key={leave.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{leave.user?.name || "-"}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {leave.user?.userId} &middot; {leave.user?.role}
                      {leave.user?.class ? ` · ${leave.user.class}` : ""}
                    </div>
                    <div className="text-sm mt-1">
                      {formatDateStr(leave.fromDate)} →{" "}
                      {formatDateStr(leave.toDate)}
                    </div>
                    {leave.remark && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {leave.remark}
                      </div>
                    )}
                    <div className="mt-1">{getStatusBadge(leave.status)}</div>
                  </div>
                  {leave.status === "PENDING" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleReview(leave.id, "APPROVED")}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(leave.id, "REJECTED")}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Holiday
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : holidays.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No holidays found. Click &quot;Add Holiday&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {holidays.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {formatDateStr(h.date)}
                  </div>
                  {h.remark && (
                    <div className="text-sm text-muted-foreground">
                      {h.remark}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {h.classes.map((cls) => (
                      <Badge key={cls} variant="outline" className="text-xs">
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteHoliday(h)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
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
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
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
  const [report, setReport] = useState<{
    date: string;
    isHoliday: boolean;
    holidayRemark?: string | null;
    summary: {
      total: number;
      present: number;
      absent: number;
      leave: number;
      holiday: number;
    };
    report: DailyReportRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

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
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
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
              <Label>Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[180px]">
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
            <Button onClick={generate} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              <span className="ml-1">Generate</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{report.summary.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {report.summary.present}
                </div>
                <div className="text-xs text-muted-foreground">Present</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {report.summary.absent}
                </div>
                <div className="text-xs text-muted-foreground">Absent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {report.summary.leave}
                </div>
                <div className="text-xs text-muted-foreground">Leave</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {report.summary.holiday}
                </div>
                <div className="text-xs text-muted-foreground">Holiday</div>
              </CardContent>
            </Card>
          </div>

          {report.isHoliday && report.holidayRemark && (
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <span className="text-sm font-medium">Holiday: </span>
                <span className="text-sm">{report.holidayRemark}</span>
              </CardContent>
            </Card>
          )}

          {/* Detail Table */}
          {report.report.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Check-Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.report.map((rec) => (
                        <TableRow key={rec.userId}>
                          <TableCell className="font-medium">
                            {rec.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.userId}
                          </TableCell>
                          <TableCell className="text-sm">
                            {rec.class || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTimeStr(rec.checkIn)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTimeStr(rec.checkOut)}
                          </TableCell>
                          <TableCell>{getStatusBadge(rec.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
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
  const [report, setReport] = useState<{
    month: string;
    timezone: string;
    report: MonthlyReportRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const generate = async () => {
    if (!month) {
      toast.error("Please select a month");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (className !== "ALL") params.set("class", className);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label>Month (YYYY-MM)</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[180px]">
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
            <Button onClick={generate} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              <span className="ml-1">Generate</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && report.report.length > 0 && (
        <div className="space-y-3">
          {report.report.map((rec) => (
            <Card key={rec.userId}>
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
                        <div className="font-medium">{rec.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rec.userId} &middot; {rec.class || "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-3 text-sm">
                          <span className="text-green-600">
                            P:{rec.summary.present}
                          </span>
                          <span className="text-red-600">
                            A:{rec.summary.absent}
                          </span>
                          <span className="text-yellow-600">
                            L:{rec.summary.leave}
                          </span>
                          <span className="text-blue-600">
                            H:{rec.summary.holiday}
                          </span>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            expandedUser === rec.userId ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    <div className="flex sm:hidden items-center gap-3 text-sm mt-1">
                      <span className="text-green-600">
                        P:{rec.summary.present}
                      </span>
                      <span className="text-red-600">
                        A:{rec.summary.absent}
                      </span>
                      <span className="text-yellow-600">
                        L:{rec.summary.leave}
                      </span>
                      <span className="text-blue-600">
                        H:{rec.summary.holiday}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator className="my-3" />
                    {/* Subject Summary */}
                    {Object.keys(rec.subjectSummary).length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium mb-2">
                          Subject-wise Summary
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(rec.subjectSummary).map(
                            ([subject, counts]) => (
                              <div
                                key={subject}
                                className="text-xs bg-muted rounded-md p-2"
                              >
                                <div className="font-medium mb-1">{subject}</div>
                                <div className="flex gap-2">
                                  <span className="text-green-600">
                                    P:{counts.present}
                                  </span>
                                  <span className="text-red-600">
                                    A:{counts.absent}
                                  </span>
                                  <span className="text-yellow-600">
                                    L:{counts.leave}
                                  </span>
                                  <span className="text-blue-600">
                                    H:{counts.holiday}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {/* Daily Breakdown */}
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Daily Breakdown
                      </div>
                      <ScrollArea className="max-h-48">
                        <div className="grid grid-cols-7 gap-1">
                          {Object.entries(rec.dailyStatus)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([dateStr, info]) => {
                              const day = dateStr.split("-")[2];
                              const colorMap: Record<string, string> = {
                                PRESENT: "bg-green-100 text-green-800",
                                ABSENT: "bg-red-100 text-red-800",
                                LEAVE: "bg-yellow-100 text-yellow-800",
                                HOLIDAY: "bg-blue-100 text-blue-800",
                              };
                              return (
                                <div
                                  key={dateStr}
                                  className={`text-center rounded p-1 text-xs ${
                                    colorMap[info.status] || "bg-muted"
                                  }`}
                                  title={`${dateStr}: ${info.status}${
                                    info.checkIn
                                      ? ` (In: ${formatTimeStr(info.checkIn)})`
                                      : ""
                                  }${
                                    info.checkOut
                                      ? ` (Out: ${formatTimeStr(info.checkOut)})`
                                      : ""
                                  }`}
                                >
                                  <div className="font-medium">{day}</div>
                                  <div className="text-[10px]">
                                    {info.status.charAt(0)}
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
            </Card>
          ))}
        </div>
      )}

      {report && report.report.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No data found for the selected month/class.
          </CardContent>
        </Card>
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full">
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
            <Label>Time Format</Label>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Telegram Bot Token */}
          <div className="space-y-2">
            <Label htmlFor="telegram-token">Telegram Bot Token</Label>
            <Input
              id="telegram-token"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="Enter Telegram bot token"
            />
            <p className="text-xs text-muted-foreground">
              Used for sending attendance notifications.
            </p>
          </div>

          <Separator />

          {/* Daily Report Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Report</Label>
              <p className="text-xs text-muted-foreground">
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
              <Label htmlFor="report-time">Daily Report Time</Label>
              <Input
                id="report-time"
                type="time"
                value={dailyReportTime}
                onChange={(e) => setDailyReportTime(e.target.value)}
              />
            </div>
          )}

          <Separator />

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
