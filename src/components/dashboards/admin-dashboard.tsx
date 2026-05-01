"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { CLASSES, CLASS_SUBJECTS, parseTeacherSubjects, getAllSubjectsFromClassMap, getTeacherClasses } from "@/lib/constants";
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
import { Tooltip as TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  LayoutDashboard,
  Menu,
  Sun,
  Moon,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import jsPDF from "jspdf";

import type { AuthUser } from "@/stores/auth-store";

// ─── Color Theme Constants ──────────────────────────────────────────────────

const THEME = {
  primary: "#2F2FE4",
  secondary: "#162E93",
  accent: "#1A1953",
  dark: "#080616",
} as const;

const STUDENT_CARD = {
  primary: "#2F2FE4",
  secondary: "#162E93",
  accent: "#1A1953",
  headerGradient: ["#1A1953", "#2F2FE4"],
} as const;

const TEACHER_CARD = {
  primary: "#DC2626",
  secondary: "#991B1B",
  accent: "#7F1D1D",
  headerGradient: ["#7F1D1D", "#DC2626"],
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
  studentReport?: DailyReportRecord[];
  teacherReport?: DailyReportRecord[];
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
  studentReport?: MonthlyReportRecord[];
  teacherReport?: MonthlyReportRecord[];
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

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, tab: "dashboard" },
  { key: "attendance", label: "Attendance", icon: ScanLine, tab: "scanner" },
  { key: "reports", label: "Reports", icon: FileBarChart, tab: "reports" },
  { key: "students", label: "Students", icon: Users, tab: "students" },
  { key: "teachers", label: "Teachers", icon: GraduationCap, tab: "teachers" },
  { key: "leave", label: "Leave", icon: Clock, tab: "leave" },
  { key: "holidays", label: "Holidays", icon: CalendarDays, tab: "holidays" },
  { key: "idcards", label: "ID Cards", icon: IdCard, tab: "idcards" },
  { key: "settings", label: "Settings", icon: Settings, tab: "settings" },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

function getActiveLabel(navKey: NavKey): string {
  const item = NAV_ITEMS.find((n) => n.key === navKey);
  return item ? item.label : "Dashboard";
}

export default function AdminDashboard({ user: userProp }: { user: AuthUser }) {
  const { logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab = NAV_ITEMS.find((n) => n.key === activeNav)?.tab ?? "dashboard";

  const handleNavClick = (key: NavKey) => {
    setActiveNav(key);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop Sidebar (lg+) ── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 z-30 border-r dark:border-white/10 border-border bg-card dark:bg-[#1A1953]"
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b dark:border-white/10 border-border">
          <div
            className="flex items-center justify-center rounded-xl p-1.5 bg-primary"
          >
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground dark:text-white tracking-tight">
              Sankalp Attendance
            </h1>
            <p className="text-[10px] text-foreground/50 dark:text-white/40">Admin Panel</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-foreground/60 dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
                }`}
                style={isActive ? { background: THEME.primary } : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t dark:border-white/10 border-border px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-foreground dark:text-white/80 truncate">{userProp.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r dark:border-white/10 border-border bg-card dark:bg-[#1A1953] transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-5 border-b dark:border-white/10 border-border">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl p-1.5 bg-primary"
            >
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground dark:text-white tracking-tight">
                Sankalp Attendance
              </h1>
              <p className="text-[10px] text-foreground/50 dark:text-white/40">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-foreground/60 dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
                }`}
                style={isActive ? { background: THEME.primary } : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info + Logout */}
        <div className="border-t dark:border-white/10 border-border px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-foreground dark:text-white/80 truncate">{userProp.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-foreground/60 dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="sticky top-0 z-30 border-b dark:border-white/10 border-border bg-primary dark:bg-gradient-to-r dark:from-[#1A1953] dark:to-[#162E93]"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Hamburger - mobile only */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-primary-foreground/70 dark:text-white/70 hover:text-primary-foreground dark:hover:text-white hover:bg-white/10"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-bold text-primary-foreground tracking-tight">
                {getActiveLabel(activeNav)}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 dark:bg-white/10">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-sm text-white/80">{userProp.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 dark:border-white/20 dark:hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "students" && <StudentsTab />}
          {activeTab === "teachers" && <TeachersTab />}
          {activeTab === "scanner" && <QRScannerTab />}
          {activeTab === "idcards" && <IDCardsTab />}
          {activeTab === "leave" && <LeaveTab adminUserId={userProp.userId} />}
          {activeTab === "holidays" && <HolidaysTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
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
    PRESENT: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
    ABSENT: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
    LEAVE: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
    HOLIDAY: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
    PENDING: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30",
    APPROVED: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
    REJECTED: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30",
    NO_CLASS: "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30",
  };
  const cls = colorMap[status] || "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30";
  return (
    <Badge className={`${cls} rounded-full border text-[10px] font-semibold px-2.5 py-0.5`} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  );
}

// ─── PDF Generation Helpers ──────────────────────────────────────────────────

const PDF_COLORS = {
  headerBg: "#1A1953",
  headerText: "#FFFFFF",
  sectionHeader: "#2F2FE4",
  bodyText: "#333333",
  lightText: "#666666",
  altRow: "#F5F5F5",
  white: "#FFFFFF",
  border: "#CCCCCC",
  divider: "#D0D0D0",
  present: "#16A34A",
  presentBg: "#DCFCE7",
  absent: "#DC2626",
  absentBg: "#FEE2E2",
  leave: "#D97706",
  leaveBg: "#FEF3C7",
  holiday: "#7C3AED",
  holidayBg: "#EDE9FE",
  noClass: "#6B7280",
  noClassBg: "#F3F4F6",
  footerLine: "#BBBBBB",
  footerText: "#888888",
};

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PRESENT: PDF_COLORS.present,
    ABSENT: PDF_COLORS.absent,
    LEAVE: PDF_COLORS.leave,
    HOLIDAY: PDF_COLORS.holiday,
    NO_CLASS: PDF_COLORS.noClass,
  };
  return map[status] || PDF_COLORS.bodyText;
}

function getStatusBgColor(status: string): string {
  const map: Record<string, string> = {
    PRESENT: PDF_COLORS.presentBg,
    ABSENT: PDF_COLORS.absentBg,
    LEAVE: PDF_COLORS.leaveBg,
    HOLIDAY: PDF_COLORS.holidayBg,
    NO_CLASS: PDF_COLORS.noClassBg,
  };
  return map[status] || PDF_COLORS.white;
}

function drawPDFFooter(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const footY = pageH - 15;
  doc.setDrawColor(PDF_COLORS.footerLine);
  doc.setLineWidth(0.3);
  doc.line(margin, footY - 3, pageW - margin, footY - 3);
  doc.setTextColor(PDF_COLORS.footerText);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("Generated by Sankalp Attendance Management System", margin, footY);
  doc.text(new Date().toLocaleString(), pageW - margin, footY, { align: "right" });
}

// Smart table header with consistent styling
function drawTableHeader(
  doc: jsPDF,
  y: number,
  headers: string[],
  colWidths: number[],
  startX: number
): number {
  const rowH = 10;
  const padding = 3;
  const tableW = colWidths.reduce((a, b) => a + b, 0);

  // Header background with rounded-look
  doc.setFillColor(PDF_COLORS.headerBg);
  doc.rect(startX, y, tableW, rowH, "F");

  // Header text
  doc.setTextColor(PDF_COLORS.headerText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let x = startX + padding;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, y + rowH / 2, { baseline: "middle" } as jsPDF.textOptions);
    x += colWidths[i];
  }

  // Bottom border accent
  doc.setDrawColor(PDF_COLORS.sectionHeader);
  doc.setLineWidth(0.5);
  doc.line(startX, y + rowH, startX + tableW, y + rowH);

  return y + rowH;
}

// Smart table row with auto text wrapping, dynamic row height, and page break handling
function drawTableRow(
  doc: jsPDF,
  y: number,
  cells: string[],
  colWidths: number[],
  startX: number,
  isAlt: boolean,
  statusColumnIndex?: number
): number {
  const padding = 3;
  const lineHeight = 4; // mm per line of text at 8pt
  const minRowH = 10;
  const tableW = colWidths.reduce((a, b) => a + b, 0);
  const bottomMargin = 25;

  // Step 1: Calculate how many lines each cell needs using splitTextToSize
  doc.setFontSize(8);
  const cellLines: string[][] = [];
  let maxLines = 0;

  for (let i = 0; i < cells.length; i++) {
    const maxW = colWidths[i] - padding * 2;
    const text = cells[i] || "-";
    const lines = doc.splitTextToSize(text, maxW);
    cellLines.push(lines);
    if (lines.length > maxLines) maxLines = lines.length;
  }

  // Step 2: Calculate dynamic row height
  const rowH = Math.max(minRowH, maxLines * lineHeight + padding * 2);

  // Step 3: Check if row fits on current page
  if (y + rowH > doc.internal.pageSize.getHeight() - bottomMargin) {
    drawPDFFooter(doc);
    doc.addPage();
    y = 20;
  }

  // Step 4: Draw row background
  if (isAlt) {
    doc.setFillColor(PDF_COLORS.altRow);
    doc.rect(startX, y, tableW, rowH, "F");
  }

  // Step 5: Draw cell borders
  doc.setDrawColor(PDF_COLORS.border);
  doc.setLineWidth(0.2);
  // Outer border
  doc.rect(startX, y, tableW, rowH, "S");
  // Vertical cell separators
  let lineX = startX;
  for (let i = 0; i < colWidths.length - 1; i++) {
    lineX += colWidths[i];
    doc.line(lineX, y, lineX, y + rowH);
  }

  // Step 6: Draw text in each cell (line by line, vertically centered)
  doc.setFontSize(8);
  let x = startX + padding;
  for (let i = 0; i < cells.length; i++) {
    const lines = cellLines[i];
    const textBlockH = lines.length * lineHeight;
    // Center the text block vertically within the cell
    const textStartY = y + (rowH - textBlockH) / 2 + lineHeight * 0.7;

    if (statusColumnIndex !== undefined && i === statusColumnIndex) {
      // Draw status with colored background pill
      const statusText = lines[0] || "-";
      const statusColor = getStatusColor(statusText);
      const statusBg = getStatusBgColor(statusText);
      const pillPadX = 2;
      const pillPadY = 1;
      const textW = doc.getTextWidth(statusText);
      const pillW = textW + pillPadX * 2;
      const pillH = lineHeight;
      const pillX = x + (colWidths[i] - padding * 2 - pillW) / 2;
      const pillY = y + (rowH - pillH) / 2;

      doc.setFillColor(statusBg);
      doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, "F");
      doc.setTextColor(statusColor);
      doc.setFont("helvetica", "bold");
      doc.text(statusText, pillX + pillPadX, pillY + pillH / 2, { baseline: "middle" } as jsPDF.textOptions);
    } else {
      doc.setTextColor(PDF_COLORS.bodyText);
      doc.setFont("helvetica", "normal");
      for (let li = 0; li < lines.length; li++) {
        doc.text(lines[li], x, textStartY + li * lineHeight);
      }
    }
    x += colWidths[i];
  }

  return y + rowH;
}

function checkPageSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 25) {
    drawPDFFooter(doc);
    doc.addPage();
    return 20;
  }
  return y;
}

// Draw a section divider with title
function drawSectionDivider(doc: jsPDF, y: number, title: string, margin: number, pageW: number): number {
  doc.setDrawColor(PDF_COLORS.divider);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 2;
  doc.setDrawColor(PDF_COLORS.sectionHeader);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + 40, y);
  y += 5;
  doc.setTextColor(PDF_COLORS.sectionHeader);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, y);
  y += 7;
  return y;
}

// Draw the common PDF header bar
function drawPDFHeader(doc: jsPDF, title: string, subtitle: string, dateText: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(PDF_COLORS.headerBg);
  doc.rect(0, 0, pageW, 38, "F");

  // Decorative accent line at bottom of header
  doc.setDrawColor(PDF_COLORS.sectionHeader);
  doc.setLineWidth(1);
  doc.line(0, 38, pageW, 38);

  // Org name
  doc.setTextColor(PDF_COLORS.headerText);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Sankalp Vidya Academy", pageW / 2, 14, { align: "center" });

  // Report type
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text(title, pageW / 2, 23, { align: "center" });

  // Date/Month
  doc.setFontSize(10);
  doc.setTextColor("#CCCCCC");
  doc.text(dateText, pageW / 2, 32, { align: "center" });
}

function generateDailyReportPDF(
  report: DailyReportData,
  dateStr: string,
  className: string,
  roleFilter: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header ──
  const d = new Date(dateStr + "T00:00:00");
  const formattedDate = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  drawPDFHeader(doc, "Daily Attendance Report", formattedDate, dateStr);

  let y = 48;

  // ── Filters ──
  doc.setTextColor(PDF_COLORS.sectionHeader);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Filters", margin, y);
  y += 5;
  doc.setTextColor(PDF_COLORS.lightText);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const classLabel = className === "ALL" ? "All Classes" : className;
  const roleLabel = roleFilter === "ALL" ? "All" : roleFilter;
  doc.text(`Class: ${classLabel}  |  Role: ${roleLabel}`, margin, y);
  y += 10;

  // ── Summary Table ──
  y = checkPageSpace(doc, y, 35);
  y = drawSectionDivider(doc, y, "Summary", margin, pageW);

  const sumHeaders = ["Total", "Present", "Absent", "Leave", "Holiday"];
  const sumWidths = [contentW / 5, contentW / 5, contentW / 5, contentW / 5, contentW / 5];
  y = drawTableHeader(doc, y, sumHeaders, sumWidths, margin);
  y = drawTableRow(
    doc,
    y,
    [
      String(report.summary.total),
      String(report.summary.present),
      String(report.summary.absent),
      String(report.summary.leave),
      String(report.summary.holiday),
    ],
    sumWidths,
    margin,
    false
  );
  y += 10;

  // ── QR Logs ──
  if (report.qrLogs && report.qrLogs.length > 0) {
    y = checkPageSpace(doc, y, 35);
    y = drawSectionDivider(doc, y, "QR Logs", margin, pageW);

    const qrHeaders = ["Name", "Role", "Check-In", "Check-Out", "Status"];
    const qrWidths = [contentW * 0.30, contentW * 0.14, contentW * 0.18, contentW * 0.18, contentW * 0.20];
    y = drawTableHeader(doc, y, qrHeaders, qrWidths, margin);
    report.qrLogs.forEach((log, i) => {
      y = drawTableRow(
        doc,
        y,
        [log.name, log.role, formatTimeStr(log.checkIn), formatTimeStr(log.checkOut), log.status],
        qrWidths,
        margin,
        i % 2 === 1,
        4
      );
    });
    y += 10;
  }

  // ── Student Report ──
  if ((report.studentReport ?? []).length > 0) {
    y = checkPageSpace(doc, y, 35);
    y = drawSectionDivider(doc, y, `Student Report (${(report.studentReport ?? []).length})`, margin, pageW);

    const sHeaders = ["Name", "ID", "Class", "Check-In", "Check-Out", "Status", "Subjects"];
    const sWidths = [
      contentW * 0.22,
      contentW * 0.11,
      contentW * 0.09,
      contentW * 0.11,
      contentW * 0.11,
      contentW * 0.12,
      contentW * 0.24,
    ];
    y = drawTableHeader(doc, y, sHeaders, sWidths, margin);
    (report.studentReport ?? []).forEach((rec, i) => {
      const subjectsStr = rec.subjects
        ? rec.subjects.map((s) => `${s.subject.charAt(0)}:${s.status.charAt(0)}`).join(" ")
        : "-";
      y = drawTableRow(
        doc,
        y,
        [
          rec.name,
          rec.userId,
          rec.class || "-",
          formatTimeStr(rec.checkIn),
          formatTimeStr(rec.checkOut),
          rec.status,
          subjectsStr,
        ],
        sWidths,
        margin,
        i % 2 === 1,
        5
      );
    });
    y += 10;
  }

  // ── Teacher Report ──
  if ((report.teacherReport ?? []).length > 0) {
    y = checkPageSpace(doc, y, 35);
    y = drawSectionDivider(doc, y, `Teacher Report (${(report.teacherReport ?? []).length})`, margin, pageW);

    const tHeaders = ["Name", "ID", "Check-In", "Check-Out", "Status", "Subjects"];
    const tWidths = [contentW * 0.26, contentW * 0.14, contentW * 0.14, contentW * 0.14, contentW * 0.14, contentW * 0.18];
    y = drawTableHeader(doc, y, tHeaders, tWidths, margin);
    (report.teacherReport ?? []).forEach((rec, i) => {
      const subjectsStr = rec.subjects
        ? rec.subjects.map((s) => `${s.subject.charAt(0)}:${s.status.charAt(0)}`).join(" ")
        : "-";
      y = drawTableRow(
        doc,
        y,
        [rec.name, rec.userId, formatTimeStr(rec.checkIn), formatTimeStr(rec.checkOut), rec.status, subjectsStr],
        tWidths,
        margin,
        i % 2 === 1,
        4
      );
    });
    y += 10;
  }

  // ── Footer (only on last page) ──
  drawPDFFooter(doc);

  const fileName = `Daily_Report_${dateStr}.pdf`;
  doc.save(fileName);
}

function generateMonthlyReportPDF(
  report: MonthlyReportData,
  monthStr: string,
  className: string,
  roleFilter: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header ──
  const [yr, mn] = monthStr.split("-");
  const monthDate = new Date(parseInt(yr), parseInt(mn) - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  drawPDFHeader(doc, "Monthly Attendance Report", formattedMonth, monthStr);

  let y = 48;

  // ── Filters ──
  doc.setTextColor(PDF_COLORS.sectionHeader);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Filters", margin, y);
  y += 5;
  doc.setTextColor(PDF_COLORS.lightText);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const classLabel = className === "ALL" ? "All Classes" : className;
  const roleLabel = roleFilter === "ALL" ? "All" : roleFilter;
  doc.text(`Class: ${classLabel}  |  Role: ${roleLabel}`, margin, y);
  y += 10;

  const allRecords = [...(report.studentReport ?? []), ...(report.teacherReport ?? [])];

  allRecords.forEach((rec) => {
    y = checkPageSpace(doc, y, 55);

    // User section divider
    y = drawSectionDivider(doc, y, `${rec.name} (${rec.userId})`, margin, pageW);

    // User info bar
    const infoBarH = 10;
    doc.setFillColor(PDF_COLORS.sectionHeader);
    doc.setTextColor(PDF_COLORS.headerText);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.roundedRect(margin, y, contentW, infoBarH, 2, 2, "F");
    const recRoleLabel = rec.class ? `Class: ${rec.class}` : "Teacher";
    doc.text(`${rec.name}`, margin + 4, y + infoBarH / 2, { baseline: "middle" } as jsPDF.textOptions);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(recRoleLabel, margin + contentW - 4, y + infoBarH / 2, { align: "right", baseline: "middle" } as jsPDF.textOptions);
    y += infoBarH + 4;

    // Summary row
    y = checkPageSpace(doc, y, 28);
    const sumHeaders = ["Total Days", "Present", "Absent", "Leave", "Holiday"];
    const sumW = [contentW / 5, contentW / 5, contentW / 5, contentW / 5, contentW / 5];
    y = drawTableHeader(doc, y, sumHeaders, sumW, margin);
    y = drawTableRow(
      doc,
      y,
      [
        String(rec.summary.totalDays),
        String(rec.summary.present),
        String(rec.summary.absent),
        String(rec.summary.leave),
        String(rec.summary.holiday),
      ],
      sumW,
      margin,
      false
    );
    y += 8;

    // Subject summary
    if (Object.keys(rec.subjectSummary).length > 0) {
      y = checkPageSpace(doc, y, 35);
      doc.setTextColor(PDF_COLORS.sectionHeader);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Subject-wise Summary", margin, y);
      y += 6;

      const subHeaders = ["Subject", "Present", "Absent", "Leave", "Holiday", "No Class"];
      const subW = [
        contentW * 0.30,
        contentW * 0.14,
        contentW * 0.14,
        contentW * 0.14,
        contentW * 0.14,
        contentW * 0.14,
      ];
      y = drawTableHeader(doc, y, subHeaders, subW, margin);
      const subEntries = Object.entries(rec.subjectSummary);
      subEntries.forEach(([subject, counts], si) => {
        y = checkPageSpace(doc, y, 12);
        y = drawTableRow(
          doc,
          y,
          [
            subject,
            String(counts.present),
            String(counts.absent),
            String(counts.leave),
            String(counts.holiday),
            String(counts.noClass || 0),
          ],
          subW,
          margin,
          si % 2 === 1
        );
      });
      y += 8;
    }

    y += 6;
  });

  // ── Footer (only on last page) ──
  drawPDFFooter(doc);

  const fileName = `Monthly_Report_${monthStr}.pdf`;
  doc.save(fileName);
}

// ─── Styled Card Wrapper ─────────────────────────────────────────────────────

function ThemedCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`bg-card border-border text-card-foreground ${className}`}>
      {children}
    </Card>
  );
}

// ─── Dashboard Tab ─────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, presentToday: 0, totalToday: 0, pendingLeaves: 0, holidaysThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [usersRes, attendanceRes, leaveRes, holidaysRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/attendance?date=${today}`),
          fetch("/api/leave?status=PENDING"),
          fetch(`/api/holidays?month=${today.slice(0, 7)}`),
        ]);
        const usersData = await usersRes.json();
        const attendanceData = await attendanceRes.json();
        const leaveData = await leaveRes.json();
        const holidaysData = await holidaysRes.json();

        const users = Array.isArray(usersData) ? usersData : [];
        const students = users.filter((u: StudentOrTeacher) => u.role === "STUDENT");
        const teachers = users.filter((u: StudentOrTeacher) => u.role === "TEACHER");
        const records = Array.isArray(attendanceData.records) ? attendanceData.records : [];
        const presentToday = records.filter((r: { status: string }) => r.status === "PRESENT").length;
        const pendingLeaves = Array.isArray(leaveData.leaveRequests) ? leaveData.leaveRequests.length : 0;
        const holidays = Array.isArray(holidaysData.holidays) ? holidaysData.holidays.length : 0;

        setStats({ students: students.length, teachers: teachers.length, presentToday, totalToday: records.length, pendingLeaves, holidaysThisMonth: holidays });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Students", value: stats.students, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { label: "Teachers", value: stats.teachers, icon: GraduationCap, color: "text-purple-600 dark:text-purple-400" },
    { label: "Present Today", value: stats.presentToday, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    { label: "Pending Leaves", value: stats.pendingLeaves, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Dashboard</h2>
        <p className="text-sm text-muted-foreground dark:text-white/50">Overview of your attendance system</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <ThemedCard key={card.label}>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground dark:text-white">{card.value}</p>
                <p className="text-xs text-muted-foreground dark:text-white/50">{card.label}</p>
              </CardContent>
            </ThemedCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ThemedCard>
          <CardHeader>
            <CardTitle className="text-sm text-foreground dark:text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground dark:text-white/50">Use the sidebar to navigate to different modules.</p>
          </CardContent>
        </ThemedCard>
        <ThemedCard>
          <CardHeader>
            <CardTitle className="text-sm text-foreground dark:text-white">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-white/50">Total Records</span>
                <span className="font-medium text-foreground dark:text-white">{stats.totalToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-white/50">Present</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.presentToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground dark:text-white/50">Holidays This Month</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{stats.holidaysThisMonth}</span>
              </div>
            </div>
          </CardContent>
        </ThemedCard>
      </div>
    </div>
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/50 dark:text-white/40" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus:border-[#2F2FE4]"
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
          <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
        </div>
      ) : students.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
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
                    <div className="font-semibold text-card-foreground dark:text-white truncate">{s.name}</div>
                    <div className="text-sm text-foreground/60 dark:text-white/50 mt-0.5">
                      ID: <span className="font-mono text-foreground/70 dark:text-white/70">{s.userId}</span>
                    </div>
                    <div className="text-sm text-foreground/60 dark:text-white/50">
                      Class: <span className="text-foreground/70 dark:text-white/70">{s.class || "-"}</span>
                    </div>
                    {s.subjects && Array.isArray(s.subjects) && s.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.subjects.map((sub) => (
                          <Badge
                            key={sub}
                            variant="outline"
                            className="text-[10px] bg-[#2F2FE4]/10 text-[#2F2FE4] border-[#2F2FE4]/20 dark:bg-[#2F2FE4]/20 dark:border-[#2F2FE4]/30 rounded-full px-2"
                          >
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {s.phone && (
                      <div className="text-sm text-foreground/60 dark:text-white/50 mt-1">
                        Phone: <span className="text-foreground/70 dark:text-white/70">{s.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-foreground/50 dark:text-white/40">Password:</span>
                      <span className="text-xs font-mono text-foreground dark:text-white/80">
                        {visiblePasswords[s.userId]
                          ? s.plainPassword || "Not available"
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 min-h-[28px] min-w-[28px] hover:bg-muted dark:hover:bg-white/10 text-foreground/60 dark:text-white/50 dark:hover:text-white/80"
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
                      className="dark:border-white/10 text-foreground/70 dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => handleEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
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
        <DialogContent className="dark:bg-popover">
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
        <DialogContent className="dark:bg-popover">
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
      <DialogContent className="dark:bg-popover max-h-[90vh] overflow-y-auto">
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
                <div
                  key={sub}
                  onClick={() => toggleSubject(sub)}
                  className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-muted/50 rounded-md transition-colors select-none"
                >
                  <Checkbox
                    checked={subjects.includes(sub)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm font-normal">
                    {sub}
                  </span>
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
      // Parse teacher subjects using the new helper
      const classSubjectMap = parseTeacherSubjects(
        typeof teacher.subjects === "string" ? teacher.subjects : JSON.stringify(teacher.subjects ?? null)
      );
      const teacherClasses = getTeacherClasses(classSubjectMap);

      if (teacherClasses.length === 0) {
        toast.error("No classes assigned to this teacher");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      for (const cls of teacherClasses) {
        const relevantSubjects = classSubjectMap[cls] || [];

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
    subjects: string[] | Record<string, string[]>;
    phone: string;
  }) => {
    try {
      if (editTeacher) {
        const res = await fetch(`/api/users/${editTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            subjects: data.subjects, // Will be JSON stringified by API
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/50 dark:text-white/40" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus:border-[#2F2FE4]"
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
          <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
        </div>
      ) : teachers.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
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
                    <div className="font-semibold text-card-foreground dark:text-white truncate">{t.name}</div>
                    <div className="text-sm text-foreground/60 dark:text-white/50 mt-0.5">
                      ID: <span className="font-mono text-foreground/70 dark:text-white/70">{t.userId}</span>
                    </div>
                    {t.subjects && (
                      <div className="mt-2 space-y-1.5">
                        {(() => {
                          // Parse teacher subjects - support both old flat array and new class-subjects map
                          const parsed = parseTeacherSubjects(
                            typeof t.subjects === "string" ? t.subjects : JSON.stringify(t.subjects)
                          );
                          const classes = getTeacherClasses(parsed);
                          if (classes.length === 0) {
                            // Old format: flat array
                            const flatSubjects = Array.isArray(t.subjects) ? t.subjects : [];
                            return flatSubjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {flatSubjects.map((sub: string) => (
                                  <Badge
                                    key={sub}
                                    variant="outline"
                                    className="text-[10px] bg-[#2F2FE4]/10 text-[#2F2FE4] border-[#2F2FE4]/20 dark:bg-[#2F2FE4]/20 dark:border-[#2F2FE4]/30 rounded-full px-2"
                                  >
                                    {sub}
                                  </Badge>
                                ))}
                              </div>
                            ) : null;
                          }
                          // New format: class-subjects mapping
                          return classes.map((cls) => (
                            <div key={cls} className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-semibold text-foreground/60 dark:text-white/50 mr-1">{cls}:</span>
                              {(parsed[cls] || []).map((sub) => (
                                <Badge
                                  key={`${cls}-${sub}`}
                                  variant="outline"
                                  className="text-[10px] bg-[#2F2FE4]/10 text-[#2F2FE4] border-[#2F2FE4]/20 dark:bg-[#2F2FE4]/20 dark:border-[#2F2FE4]/30 rounded-full px-2"
                                >
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    {t.phone && (
                      <div className="text-sm text-foreground/60 dark:text-white/50 mt-1">
                        Phone: <span className="text-foreground/70 dark:text-white/70">{t.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-foreground/50 dark:text-white/40">Password:</span>
                      <span className="text-xs font-mono text-foreground dark:text-white/80">
                        {visiblePasswords[t.userId]
                          ? t.plainPassword || "Not available"
                          : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 min-h-[28px] min-w-[28px] hover:bg-muted dark:hover:bg-white/10 text-foreground/60 dark:text-white/50 dark:hover:text-white/80"
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
                      className="border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-300 min-h-[44px] rounded-xl"
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
                      className="dark:border-white/10 text-foreground/70 dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 min-h-[44px] min-w-[44px] rounded-xl"
                      onClick={() => handleEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
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
        <DialogContent className="dark:bg-popover">
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
        <DialogContent className="dark:bg-popover">
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
  // Handle NEW format: class-subjects mapping (Record<string, string[]>)
  if (subjects && !Array.isArray(subjects) && typeof subjects === "object") {
    return Object.keys(subjects).filter((cls) => {
      const subs = (subjects as Record<string, string[]>)[cls];
      return Array.isArray(subs) && subs.length > 0;
    });
  }
  // Handle OLD format: flat array of subjects
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
    subjects: string[] | Record<string, string[]>;
    phone: string;
  }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-popover max-h-[90vh] overflow-y-auto">
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
    subjects: string[] | Record<string, string[]>;
    phone: string;
  }) => void;
  onCancel: () => void;
}) {
  // Parse existing teacher subjects into class-subjects map
  const teacherSubjects = teacher?.subjects;
  const initialClassSubjects = React.useMemo(() => {
    if (!teacherSubjects) return {};
    // Use the new parseTeacherSubjects helper
    const parsed = parseTeacherSubjects(
      typeof teacherSubjects === "string" ? teacherSubjects : JSON.stringify(teacherSubjects)
    );
    return parsed;
  }, [teacherSubjects]);

  const [name, setName] = useState(teacher?.name || "");
  const [classSubjects, setClassSubjects] = useState<Record<string, string[]>>(initialClassSubjects);
  const [phone, setPhone] = useState(teacher?.phone || "");
  const [saving, setSaving] = useState(false);
  const [activeClassTab, setActiveClassTab] = useState<string>("");

  // All classes the teacher is assigned to
  const assignedClasses = getTeacherClasses(classSubjects);

  // Set initial active tab
  React.useEffect(() => {
    if (assignedClasses.length > 0 && !activeClassTab) {
      setActiveClassTab(assignedClasses[0]);
    }
  }, [assignedClasses.length, activeClassTab]);

  const toggleClass = (cls: string) => {
    setClassSubjects((prev) => {
      const next = { ...prev };
      if (next[cls]) {
        // Remove class and its subjects
        delete next[cls];
        if (activeClassTab === cls) {
          setActiveClassTab(Object.keys(next)[0] || "");
        }
      } else {
        // Add class with empty subjects
        next[cls] = [];
        setActiveClassTab(cls);
      }
      return next;
    });
  };

  const toggleSubject = (cls: string, subject: string) => {
    setClassSubjects((prev) => {
      const currentSubjects = prev[cls] || [];
      const newSubjects = currentSubjects.includes(subject)
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];
      return { ...prev, [cls]: newSubjects };
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (assignedClasses.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    // Validate each class has at least one subject
    for (const cls of assignedClasses) {
      if (!classSubjects[cls] || classSubjects[cls].length === 0) {
        toast.error(`Please select at least one subject for ${cls}`);
        return;
      }
    }

    setSaving(true);
    await onSubmit({
      name: name.trim(),
      classes: assignedClasses,
      subjects: classSubjects, // Pass the full class-subjects map
      phone: phone.trim(),
    });
    setSaving(false);
  };

  // Get subjects available for the active class tab
  const activeClassSubjects = activeClassTab ? (CLASS_SUBJECTS[activeClassTab] || []) : [];

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

        {/* Class Selection */}
        <div className="space-y-2">
          <Label>Classes *</Label>
          <div className="grid grid-cols-1 gap-1.5 border rounded-md p-3 max-h-48 overflow-y-auto">
            {CLASSES.map((cls) => (
              <div
                key={cls}
                onClick={() => toggleClass(cls)}
                className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-muted/50 rounded-md transition-colors select-none"
              >
                <Checkbox
                  checked={assignedClasses.includes(cls)}
                  className="pointer-events-none"
                />
                <span className="text-sm font-normal">
                  {cls}
                </span>
                {assignedClasses.includes(cls) && classSubjects[cls] && classSubjects[cls].length > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    ({classSubjects[cls].length} subjects)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subject Selection per Class */}
        {assignedClasses.length > 0 && (
          <div className="space-y-2">
            <Label>Subjects per Class</Label>
            {/* Class tabs */}
            <div className="flex flex-wrap gap-1.5 border rounded-md p-2">
              {assignedClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setActiveClassTab(cls)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeClassTab === cls
                      ? "bg-[#2F2FE4] text-white"
                      : "bg-muted dark:bg-white/10 text-foreground/70 dark:text-white/70 hover:bg-muted/80 dark:hover:bg-white/15"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
            {/* Subject checkboxes for active class */}
            {activeClassTab && activeClassSubjects.length > 0 && (
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                {activeClassSubjects.map((sub) => (
                  <div
                    key={sub}
                    onClick={() => toggleSubject(activeClassTab, sub)}
                    className="flex items-center gap-2 cursor-pointer py-1 px-2 hover:bg-muted/50 rounded-md transition-colors select-none"
                  >
                    <Checkbox
                      checked={(classSubjects[activeClassTab] || []).includes(sub)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-normal">
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
    success?: boolean;
    message?: string;
    type: string;
    userName?: string;
    userId?: string;
    time?: string;
    date?: string;
    attendance: {
      id: string;
      userId: string;
      date: string;
      checkIn: string | null;
      checkOut: string | null;
      status: string;
      lastScanAt?: string | null;
    };
    cooldownSeconds?: number;
    // For already-checked-out error responses
    checkInTime?: string;
    checkOutTime?: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Cooldown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      return;
    }
    if (!cooldownTimerRef.current) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) {
              clearInterval(cooldownTimerRef.current);
              cooldownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [cooldownRemaining]);

  // Start cooldown from a given number of seconds
  const startCooldown = (seconds: number) => {
    setCooldownRemaining(seconds);
  };

  const processAttendance = async (userId: string) => {
    if (!userId.trim()) {
      toast.error("Please enter a User ID");
      return;
    }
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${cooldownRemaining} seconds before scanning again`);
      return;
    }
    setScanning(true);
    setScanResult(null);
    setScanError(null);
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult(data);
        setScanError(null);

        // Show appropriate toast
        if (data.type === "checkIn") {
          toast.success(`\u2705 Check-In Successful - ${data.userName || data.attendance?.userId} at ${data.time || ""}`);
        } else if (data.type === "checkOut") {
          toast.success(`\uD83D\uDEAA Check-Out Successful - ${data.userName || data.attendance?.userId} at ${data.time || ""}`);
        } else {
          toast.success(data.message || "Attendance updated!");
        }

        // Start cooldown
        const cooldownSec = data.cooldownSeconds || 10;
        startCooldown(cooldownSec);

        setScanInput("");
        fetchTodayAttendance();
      } else {
        // Handle error responses
        setScanError(data.error || "Scan failed");

        // If it's a cooldown error, also start the cooldown timer
        if (res.status === 429 && data.cooldownRemaining) {
          startCooldown(data.cooldownRemaining);
        }

        // If it's "already checked out", show as info result (not error-style)
        if (data.type === "alreadyCheckedOut" && data.attendance) {
          setScanResult(data);
          setScanError(null);
        }

        toast.error(data.error || "Scan failed");
      }
    } catch {
      setScanError("Failed to connect to server. Please try again.");
      toast.error("Failed to scan");
    } finally {
      setScanning(false);
    }
  };

  const handleScan = () => processAttendance(scanInput);

  // Determine the icon and color based on scan result
  const getScanResultDisplay = () => {
    if (!scanResult) return null;

    const isCheckIn = scanResult.type === "checkIn";
    const isCheckOut = scanResult.type === "checkOut";
    const isAlreadyOut = scanResult.type === "alreadyCheckedOut";

    let icon: React.ReactNode;
    let title: string;
    let bgClass: string;

    if (isCheckIn) {
      icon = <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />;
      title = "\u2705 Check-In Successful";
      bgClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30";
    } else if (isCheckOut) {
      icon = <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />;
      title = "\uD83D\uDEAA Check-Out Successful";
      bgClass = "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30";
    } else if (isAlreadyOut) {
      icon = <XCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />;
      title = "\u2713 Already Checked-Out";
      bgClass = "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
    } else {
      icon = <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />;
      title = scanResult.message || "Attendance Updated";
      bgClass = "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30";
    }

    return { icon, title, bgClass };
  };

  const scanDisplay = getScanResultDisplay();

  const isScanDisabled = scanning || cooldownRemaining > 0;

  return (
    <div className="space-y-6">
      <ThemedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground dark:text-white">
            <QrCode className="h-5 w-5 text-[#2F2FE4]" /> QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground dark:text-white/70">User ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter or scan User ID"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isScanDisabled) handleScan();
                }}
                disabled={cooldownRemaining > 0}
                className="dark:bg-white/5 dark:border-white/10 dark:text-white placeholder:text-muted-foreground dark:text-white/30 focus:border-[#2F2FE4] disabled:opacity-50"
              />
              <Button
                onClick={handleScan}
                disabled={isScanDisabled}
                className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl min-w-[44px] min-h-[44px] disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : cooldownRemaining > 0 ? (
                  <span className="text-sm font-bold">{cooldownRemaining}</span>
                ) : (
                  <ScanLine className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Cooldown Timer Banner */}
          {cooldownRemaining > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Cooldown Active
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Please wait <span className="font-bold text-base">{cooldownRemaining}</span> seconds before next scan
                </p>
              </div>
              <div className="relative h-10 w-10">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-amber-200 dark:text-amber-500/30"
                  />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(cooldownRemaining / 10) * 94.2} 94.2`}
                    strokeLinecap="round"
                    className="text-amber-500 dark:text-amber-400 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
                  {cooldownRemaining}
                </span>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full dark:border-white/10 text-muted-foreground dark:text-white/70 hover:bg-muted dark:hover:bg-white/10 rounded-xl min-h-[44px]"
            onClick={() => setCameraOpen(!cameraOpen)}
            disabled={cooldownRemaining > 0}
          >
            <Camera className="h-4 w-4 mr-2" />
            {cameraOpen ? "Close Scanner" : "Scan QR Code"}
          </Button>
          {cameraOpen && (
            <div className="rounded-xl border dark:border-white/10 border-border overflow-hidden">
              <CameraView onScan={(code) => {
                setScanInput(code);
                setCameraOpen(false);
                // Directly process the scanned code since state update is async
                processAttendance(code);
              }} />
            </div>
          )}

          {/* Scan Result Display */}
          {scanDisplay && (
            <div className={`rounded-xl border p-4 space-y-3 ${scanDisplay.bgClass}`}>
              <div className="flex items-center gap-3">
                {scanDisplay.icon}
                <div>
                  <p className="font-semibold text-lg text-card-foreground dark:text-white">
                    {scanDisplay.title}
                  </p>
                  {scanResult.userName && (
                    <p className="text-sm text-muted-foreground dark:text-white/70">
                      {scanResult.userName}
                    </p>
                  )}
                </div>
              </div>
              <Separator className="bg-border dark:bg-white/10" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {scanResult.time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground dark:text-white/50" />
                    <span className="text-muted-foreground dark:text-white/50">Time:</span>
                    <span className="font-mono font-medium text-card-foreground dark:text-white">
                      {scanResult.time}
                    </span>
                  </div>
                )}
                {scanResult.date && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground dark:text-white/50" />
                    <span className="text-muted-foreground dark:text-white/50">Date:</span>
                    <span className="font-medium text-card-foreground dark:text-white">
                      {scanResult.date}
                    </span>
                  </div>
                )}
                {scanResult.attendance?.checkIn && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground dark:text-white/50">In:</span>
                    <span className="font-mono font-medium text-card-foreground dark:text-white">
                      {formatTimeStr(scanResult.attendance.checkIn)}
                    </span>
                  </div>
                )}
                {scanResult.attendance?.checkOut ? (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-muted-foreground dark:text-white/50">Out:</span>
                    <span className="font-mono font-medium text-card-foreground dark:text-white">
                      {formatTimeStr(scanResult.attendance.checkOut)}
                    </span>
                  </div>
                ) : scanResult.type === "checkIn" ? (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground dark:text-white/30" />
                    <span className="text-muted-foreground dark:text-white/50">Out:</span>
                    <span className="font-mono text-muted-foreground dark:text-white/30">Pending</span>
                  </div>
                ) : null}
              </div>
              <div className="pt-1">
                {getStatusBadge(scanResult.attendance?.status || "PRESENT")}
              </div>
            </div>
          )}

          {/* Error Display */}
          {scanError && !scanResult && (
            <div className="rounded-xl border p-4 space-y-2 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-700 dark:text-red-300">Scan Failed</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
            </div>
          )}
        </CardContent>
      </ThemedCard>

      <ThemedCard>
        <CardHeader>
          <CardTitle className="text-base text-card-foreground dark:text-white">
            Today&apos;s Attendance ({formatDateStr(today)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-white/40" />
            </div>
          ) : todayAttendance.length === 0 ? (
            <p className="text-muted-foreground dark:text-white/40 text-center py-4">
              No attendance records for today.
            </p>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-white/10 border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground dark:text-white/50">Name</TableHead>
                    <TableHead className="text-muted-foreground dark:text-white/50">ID</TableHead>
                    <TableHead className="text-muted-foreground dark:text-white/50">Check-In</TableHead>
                    <TableHead className="text-muted-foreground dark:text-white/50">Check-Out</TableHead>
                    <TableHead className="text-muted-foreground dark:text-white/50">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((rec) => (
                    <TableRow key={rec.id} className="dark:border-white/5 border-border hover:bg-muted/50 dark:hover:bg-white/5">
                      <TableCell className="font-medium text-card-foreground dark:text-white">
                        {rec.user?.name || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground dark:text-white/70">
                        {rec.userId}
                      </TableCell>
                      <TableCell className="text-muted-foreground dark:text-white/70">
                        {formatTimeStr(rec.checkIn)}
                      </TableCell>
                      <TableCell className="text-muted-foreground dark:text-white/70">
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


// ─── Camera View with html5-qrcode ────────────────────────────────────────────

function CameraView({ onScan }: { onScan: (code: string) => void }) {
  const scannerRef = React.useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const scanLockRef = React.useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Prevent double scan
            if (scanLockRef.current) return;
            const data = decodedText?.trim();
            if (!data) return;

            scanLockRef.current = true;
            onScan(data);

            // Unlock after 5 seconds
            setTimeout(() => {
              scanLockRef.current = false;
            }, 5000);
          },
          () => {
            // QR code not found in frame — silently ignore
          }
        );

        if (!cancelled) setScannerReady(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner start error:", err);
          setError("Camera access denied or not available. Please type the User ID manually.");
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-foreground/50 dark:text-white/40 bg-muted dark:bg-white/5 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        id="qr-reader"
        className="w-full overflow-hidden rounded-lg"
        style={{ minHeight: 280 }}
      />
      {/* Scan box overlay indicator */}
      {scannerReady && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[250px] h-[250px] border-2 border-[#2F2FE4]/50 rounded-xl" />
        </div>
      )}
      {!scannerReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 dark:bg-black/60 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-[#2F2FE4]" />
        </div>
      )}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const getCardColors = (role: string) =>
    role === "TEACHER" ? TEACHER_CARD : STUDENT_CARD;

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

  const handleRemoveCard = (userId: string) => {
    if (selectedCard && selectedCard.user.userId === userId) {
      setSelectedCard(null);
      toast.success("Card removed from view");
    }
  };

  const handleDeleteCard = () => {
    setShowDeleteConfirm(false);
    setSelectedCard(null);
    toast.success("ID Card removed. You can regenerate it from the user list.");
  };

  const handleRegenerateCard = async () => {
    if (!selectedCard) return;
    const userId = selectedCard.user.userId;
    const user = users.find((u) => u.userId === userId);
    if (!user) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/id-card/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedCard(data);
        toast.success("ID Card regenerated successfully");
      } else {
        toast.error(data.error || "Failed to regenerate ID card");
      }
    } catch {
      toast.error("Failed to regenerate ID card");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedCard) return;

    try {
      const colors = getCardColors(selectedCard.user.role);
      const isStudent = selectedCard.user.role !== "TEACHER";

      const canvas = document.createElement("canvas");
      const scale = 2;
      const W = 350;
      const H = 550;
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = "#080616";
      ctx.fillRect(0, 0, W, H);

      // Role-based border
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(1.5, 1.5, W - 3, H - 3, 16);
      ctx.stroke();

      // Header gradient
      const gradient = ctx.createLinearGradient(0, 0, W, 90);
      gradient.addColorStop(0, colors.headerGradient[0]);
      gradient.addColorStop(1, colors.headerGradient[1]);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(3, 3, W - 6, 88, [14, 14, 0, 0]);
      ctx.fill();

      // Org name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sankalp Vidya Academy", W / 2, 38);

      // Role label
      const roleLabel = isStudent ? "Student ID Card" : "Teacher ID Card";
      ctx.font = "12px sans-serif";
      const roleLabelWidth = ctx.measureText(roleLabel).width + 24;
      const rlX = (W - roleLabelWidth) / 2;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.roundRect(rlX, 48, roleLabelWidth, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(roleLabel, W / 2, 65);

      // Accent line under header
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 96);
      ctx.lineTo(W - 30, 96);
      ctx.stroke();

      // Name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(selectedCard.user.name, W / 2, 126);

      // Class badge (students only)
      let yAfterClass = 140;
      if (selectedCard.user.class && isStudent) {
        yAfterClass = 152;
        const classText = selectedCard.user.class;
        ctx.font = "12px sans-serif";
        const classW = ctx.measureText(classText).width + 24;
        const clsX = (W - classW) / 2;
        ctx.fillStyle = colors.primary + "33";
        ctx.beginPath();
        ctx.roundRect(clsX, 133, classW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(classText, W / 2, 149);
      }

      // Subjects as pills
      let subjectsY = yAfterClass + 14;
      if (selectedCard.user.subjects.length > 0) {
        ctx.font = "10px sans-serif";
        const pillH = 20;
        const pillGap = 6;
        const pillPadX = 10;
        const maxRowWidth = W - 40;
        let currentRowItems: { text: string; width: number }[] = [];
        let currentRowWidth = 0;
        const rows: { text: string; width: number }[][] = [];

        for (const subj of selectedCard.user.subjects) {
          const tw = ctx.measureText(subj).width + pillPadX * 2;
          if (currentRowWidth + tw + pillGap > maxRowWidth && currentRowItems.length > 0) {
            rows.push(currentRowItems);
            currentRowItems = [];
            currentRowWidth = 0;
          }
          currentRowItems.push({ text: subj, width: tw });
          currentRowWidth += tw + pillGap;
        }
        if (currentRowItems.length > 0) rows.push(currentRowItems);

        for (const row of rows) {
          const totalRowW = row.reduce((s, i) => s + i.width, 0) + (row.length - 1) * pillGap;
          let startX = (W - totalRowW) / 2;
          for (const item of row) {
            ctx.fillStyle = colors.primary + "22";
            ctx.beginPath();
            ctx.roundRect(startX, subjectsY, item.width, pillH, 10);
            ctx.fill();
            ctx.strokeStyle = colors.primary + "55";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(startX, subjectsY, item.width, pillH, 10);
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px sans-serif";
            ctx.fillText(item.text, startX + item.width / 2, subjectsY + 14);
            startX += item.width + pillGap;
          }
          subjectsY += pillH + pillGap;
        }
      }

      // Info section (User ID & Password)
      const infoY = subjectsY + 8;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.roundRect(20, infoY, W - 40, 48, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(20, infoY, W - 40, 48, 8);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.fillText("User ID", 32, infoY + 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.fillText(selectedCard.user.userId, 32, infoY + 34);

      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.fillText("Password", W - 32, infoY + 16);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.fillText(selectedCard.user.password, W - 32, infoY + 34);

      ctx.textAlign = "center";

      // QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = selectedCard.qrCodeDataUrl;

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        setTimeout(() => reject(new Error("timeout")), 5000);
      });

      const qrSize = 160;
      const qrX = (W - qrSize) / 2;
      const qrY = infoY + 60;

      // QR glow effect
      ctx.shadowColor = colors.primary;
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.beginPath();
      ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
      ctx.fill();
      ctx.shadowBlur = 0;

      // QR border
      ctx.strokeStyle = colors.primary + "44";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 12);
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Footer
      ctx.fillStyle = "#6060a0";
      ctx.font = "10px sans-serif";
      ctx.fillText("Scan QR code to mark attendance", W / 2, H - 36);
      ctx.fillStyle = colors.primary + "aa";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("Sankalp Vidya Academy", W / 2, H - 18);

      const link = document.createElement("a");
      link.download = `${selectedCard.user.name}_${selectedCard.user.userId}.png`;
      link.href = canvas.toDataURL("image/png");
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
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/50 dark:text-white/40" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 dark:bg-white/5 dark:border-white/10 dark:text-white placeholder:text-muted-foreground dark:text-white/30 focus:border-[#2F2FE4]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
            No users found.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const cardColors = getCardColors(u.role);
            return (
              <ThemedCard key={u.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-card-foreground dark:text-white truncate">{u.name}</div>
                    <div className="text-sm text-foreground/60 dark:text-white/50">
                      {u.userId} &middot;{" "}
                      <span style={{ color: cardColors.primary }}>{u.role}</span>
                      {u.class ? ` · ${u.class}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] rounded-xl"
                      style={{
                        borderColor: cardColors.primary + "4D",
                        color: cardColors.primary,
                      }}
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
                    {selectedCard && selectedCard.user.userId === u.userId && (
                      <TooltipRoot>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-300"
                            onClick={() => handleRemoveCard(u.userId)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove Card</TooltipContent>
                      </TooltipRoot>
                    )}
                  </div>
                </CardContent>
              </ThemedCard>
            );
          })}
        </div>
      )}

      {/* ID Card Preview Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="dark:bg-popover max-w-md">
          <DialogHeader>
            <DialogTitle>ID Card Preview</DialogTitle>
          </DialogHeader>
          {selectedCard && (() => {
            const colors = getCardColors(selectedCard.user.role);
            const isStudent = selectedCard.user.role !== "TEACHER";
            const roleLabel = isStudent ? "Student ID Card" : "Teacher ID Card";
            return (
              <div className="flex flex-col items-center">
                <div
                  id="id-card-preview"
                  className="w-[350px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: `2px solid ${colors.primary}4D` }}
                >
                  {/* Header gradient */}
                  <div
                    className="px-6 pt-5 pb-4 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${colors.headerGradient[0]}, ${colors.headerGradient[1]})`,
                    }}
                  >
                    <div className="text-xl font-bold text-white tracking-wide">
                      Sankalp Vidya Academy
                    </div>
                    <div className="mt-2">
                      <span
                        className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold text-card-foreground dark:text-white"
                        style={{ background: "rgba(255,255,255,0.2)" }}
                      >
                        {roleLabel}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div
                    className="px-6 pt-4 pb-5 text-center"
                    style={{ background: `linear-gradient(180deg, ${THEME.accent}, ${THEME.dark})` }}
                  >
                    {/* Name */}
                    <div className="text-xl font-bold text-white">
                      {selectedCard.user.name}
                    </div>

                    {/* Class badge (students) */}
                    {selectedCard.user.class && isStudent && (
                      <div className="mt-2">
                        <span
                          className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{
                            background: colors.primary + "33",
                            border: `1px solid ${colors.primary}55`,
                          }}
                        >
                          {selectedCard.user.class}
                        </span>
                      </div>
                    )}

                    {/* Subjects as pills */}
                    {selectedCard.user.subjects.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                        {selectedCard.user.subjects.map((sub) => (
                          <span
                            key={sub}
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                            style={{
                              background: colors.primary + "22",
                              border: `1px solid ${colors.primary}44`,
                            }}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Info section */}
                    <div
                      className="mt-4 rounded-lg p-3 text-left grid grid-cols-2 gap-2"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div>
                        <div className="text-[10px] text-white/70 mb-0.5">User ID</div>
                        <div className="text-sm font-mono font-semibold text-white">
                          {selectedCard.user.userId}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-white/70 mb-0.5">Password</div>
                        <div className="text-sm font-mono font-semibold text-white">
                          {selectedCard.user.password}
                        </div>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="mt-4 flex justify-center">
                      <div
                        className="rounded-xl p-2"
                        style={{
                          boxShadow: `0 0 20px ${colors.primary}33`,
                          border: `1px solid ${colors.primary}44`,
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <img
                          src={selectedCard.qrCodeDataUrl}
                          alt="QR Code"
                          className="w-40 h-40 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 text-xs text-foreground/50 dark:text-white/40">
                      Scan QR code to mark attendance
                    </div>
                    <div
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: colors.primary + "aa" }}
                    >
                      Sankalp Vidya Academy
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete Card
            </Button>
            <div className="flex-1 hidden sm:block" />
            <Button
              variant="outline"
              onClick={() => setSelectedCard(null)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-1" /> Download PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="dark:bg-popover max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete ID Card
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this ID card? The user data will not be affected. You can regenerate the card anytime from the user list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCard}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
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
        <Label className="text-foreground/60 dark:text-white/60 text-sm">Filter:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] dark:bg-white/5 dark:border-white/10 dark:text-white">
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
          <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
        </div>
      ) : leaves.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
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
                    <div className="font-semibold text-card-foreground dark:text-white">{leave.user?.name || "-"}</div>
                    <div className="text-sm text-foreground/60 dark:text-white/50">
                      ID: {leave.user?.userId} &middot; {leave.user?.role}
                      {leave.user?.class ? ` · ${leave.user.class}` : ""}
                    </div>
                    <div className="text-sm text-foreground/70 dark:text-white/70 mt-1">
                      {formatDateStr(leave.fromDate)} →{" "}
                      {formatDateStr(leave.toDate)}
                    </div>
                    {leave.remark && (
                      <div className="text-sm text-foreground/50 dark:text-white/40 mt-1">
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
          <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
        </div>
      ) : holidays.length === 0 ? (
        <ThemedCard>
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
            No holidays found. Click &quot;Add Holiday&quot; to create one.
          </CardContent>
        </ThemedCard>
      ) : (
        <div className="space-y-3">
          {holidays.map((h) => (
            <ThemedCard key={h.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-card-foreground dark:text-white">
                    {formatDateStr(h.date)}
                  </div>
                  {h.remark && (
                    <div className="text-sm text-foreground/60 dark:text-white/50">
                      {h.remark}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.classes.map((cls) => (
                      <Badge
                        key={cls}
                        variant="outline"
                        className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 rounded-full px-2"
                      >
                        {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-300 min-h-[44px] min-w-[44px] rounded-xl"
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
        <DialogContent className="dark:bg-popover">
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
      <DialogContent className="dark:bg-popover max-h-[90vh] overflow-y-auto">
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
        <TabsList className="dark:bg-white/5 bg-muted border dark:border-white/10 border-border">
          <TabsTrigger
            value="daily"
            className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg"
          >
            Daily
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg"
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportSection, setReportSection] = useState<string>("students");
  const studentReportList = report?.studentReport ?? [];
  const teacherReportList = report?.teacherReport ?? [];

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

  const downloadPDF = () => {
    if (!report || !date) return;
    setPdfLoading(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      generateDailyReportPDF(report, dateStr, className, roleFilter);
      toast.success("Report downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ThemedCard>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-foreground/60 dark:text-white/60">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal dark:border-white/10 dark:text-white hover:bg-muted dark:hover:bg-white/10"
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
              <Label className="text-foreground/60 dark:text-white/60">Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[150px] dark:bg-white/5 dark:border-white/10 dark:text-white">
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
              <Label className="text-foreground/60 dark:text-white/60">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] dark:bg-white/5 dark:border-white/10 dark:text-white">
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
            <Button
              onClick={downloadPDF}
              disabled={!report || pdfLoading}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1.5">PDF</span>
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
                  <div className="h-10 w-10 rounded-xl bg-muted dark:bg-white/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-foreground/60 dark:text-white/60" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-card-foreground dark:text-white">{report.summary.total}</div>
                <div className="text-xs text-foreground/50 dark:text-white/40">Total</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {report.summary.present}
                </div>
                <div className="text-xs text-foreground/50 dark:text-white/40">Present</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {report.summary.absent}
                </div>
                <div className="text-xs text-foreground/50 dark:text-white/40">Absent</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Coffee className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {report.summary.leave}
                </div>
                <div className="text-xs text-foreground/50 dark:text-white/40">Leave</div>
              </CardContent>
            </ThemedCard>
            <ThemedCard className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {report.summary.holiday}
                </div>
                <div className="text-xs text-foreground/50 dark:text-white/40">Holiday</div>
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
                <CardTitle className="text-base text-card-foreground dark:text-white flex items-center gap-2">
                  <ScanLine className="h-4 w-4 text-[#2F2FE4]" /> QR Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-white/10 border-border hover:bg-transparent">
                        <TableHead className="text-foreground/60 dark:text-white/50">Name</TableHead>
                        <TableHead className="text-foreground/60 dark:text-white/50">Role</TableHead>
                        <TableHead className="text-foreground/60 dark:text-white/50">Check-In</TableHead>
                        <TableHead className="text-foreground/60 dark:text-white/50">Check-Out</TableHead>
                        <TableHead className="text-foreground/60 dark:text-white/50">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.qrLogs.map((log, i) => (
                        <TableRow key={`${log.userId}-${i}`} className="dark:border-white/5 border-border hover:bg-muted/50 dark:hover:bg-white/5">
                          <TableCell className="font-medium text-card-foreground dark:text-white">{log.name}</TableCell>
                          <TableCell className="text-foreground/70 dark:text-white/70 text-sm">{log.role}</TableCell>
                          <TableCell className="text-foreground/70 dark:text-white/70 text-sm">{formatTimeStr(log.checkIn)}</TableCell>
                          <TableCell className="text-foreground/70 dark:text-white/70 text-sm">{formatTimeStr(log.checkOut)}</TableCell>
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
          {(studentReportList.length > 0 || teacherReportList.length > 0) && (
            <Tabs value={reportSection} onValueChange={setReportSection}>
              <TabsList className="dark:bg-white/5 bg-muted border dark:border-white/10 border-border">
                {studentReportList.length > 0 && (
                  <TabsTrigger
                    value="students"
                    className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg gap-1.5"
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Students ({studentReportList.length})
                  </TabsTrigger>
                )}
                {teacherReportList.length > 0 && (
                  <TabsTrigger
                    value="teachers"
                    className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" /> Teachers ({teacherReportList.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {studentReportList.length > 0 && (
                <TabsContent value="students">
                  <ThemedCard>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="dark:border-white/10 border-border hover:bg-transparent">
                              <TableHead className="text-foreground/60 dark:text-white/50">Name</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">ID</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Class</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Check-In</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Check-Out</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Status</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Subjects</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentReportList.map((rec) => (
                              <TableRow key={rec.userId} className="dark:border-white/5 border-border hover:bg-muted/50 dark:hover:bg-white/5">
                                <TableCell className="font-medium text-card-foreground dark:text-white">{rec.name}</TableCell>
                                <TableCell className="font-mono text-xs text-foreground/70 dark:text-white/70">{rec.userId}</TableCell>
                                <TableCell className="text-sm text-foreground/70 dark:text-white/70">{rec.class || "-"}</TableCell>
                                <TableCell className="text-sm text-foreground/70 dark:text-white/70">{formatTimeStr(rec.checkIn)}</TableCell>
                                <TableCell className="text-sm text-foreground/70 dark:text-white/70">{formatTimeStr(rec.checkOut)}</TableCell>
                                <TableCell>{getStatusBadge(rec.status)}</TableCell>
                                <TableCell>
                                  {rec.subjects && rec.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-0.5">
                                      {rec.subjects.map((sub, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted dark:bg-white/5 text-foreground/60 dark:text-white/50"
                                          title={`${sub.subject}: ${sub.status}`}
                                        >
                                          {sub.subject.charAt(0)}
                                          <span className={`ml-0.5 ${
                                            sub.status === "PRESENT" ? "text-green-600 dark:text-green-400" :
                                            sub.status === "ABSENT" ? "text-red-600 dark:text-red-400" :
                                            sub.status === "LEAVE" ? "text-amber-600 dark:text-amber-400" :
                                            sub.status === "HOLIDAY" ? "text-purple-600 dark:text-purple-400" :
                                            sub.status === "NO_CLASS" ? "text-gray-600 dark:text-gray-400" :
                                            "text-foreground/50 dark:text-white/40"
                                          }`}>
                                            {sub.status.charAt(0)}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground dark:text-white/30">-</span>
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

              {teacherReportList.length > 0 && (
                <TabsContent value="teachers">
                  <ThemedCard>
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow className="dark:border-white/10 border-border hover:bg-transparent">
                              <TableHead className="text-foreground/60 dark:text-white/50">Name</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">ID</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Check-In</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Check-Out</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Status</TableHead>
                              <TableHead className="text-foreground/60 dark:text-white/50">Subjects</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teacherReportList.map((rec) => (
                              <TableRow key={rec.userId} className="dark:border-white/5 border-border hover:bg-muted/50 dark:hover:bg-white/5">
                                <TableCell className="font-medium text-card-foreground dark:text-white">{rec.name}</TableCell>
                                <TableCell className="font-mono text-xs text-foreground/70 dark:text-white/70">{rec.userId}</TableCell>
                                <TableCell className="text-sm text-foreground/70 dark:text-white/70">{formatTimeStr(rec.checkIn)}</TableCell>
                                <TableCell className="text-sm text-foreground/70 dark:text-white/70">{formatTimeStr(rec.checkOut)}</TableCell>
                                <TableCell>{getStatusBadge(rec.status)}</TableCell>
                                <TableCell>
                                  {rec.subjects && rec.subjects.length > 0 ? (
                                    <div className="flex flex-wrap gap-0.5">
                                      {rec.subjects.map((sub, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted dark:bg-white/5 text-foreground/60 dark:text-white/50"
                                          title={`${sub.subject}: ${sub.status}`}
                                        >
                                          {sub.subject.charAt(0)}
                                          <span className={`ml-0.5 ${
                                            sub.status === "PRESENT" ? "text-green-600 dark:text-green-400" :
                                            sub.status === "ABSENT" ? "text-red-600 dark:text-red-400" :
                                            sub.status === "NO_CLASS" ? "text-gray-600 dark:text-gray-400" :
                                            "text-foreground/50 dark:text-white/40"
                                          }`}>
                                            {sub.status.charAt(0)}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground dark:text-white/30">-</span>
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

          {studentReportList.length === 0 && teacherReportList.length === 0 && (
            <ThemedCard>
              <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
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
  const [pdfLoading, setPdfLoading] = useState(false);
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

  const downloadPDF = () => {
    if (!report || !month) return;
    setPdfLoading(true);
    try {
      generateMonthlyReportPDF(report, month, className, roleFilter);
      toast.success("Report downloaded successfully");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
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
                <div className="font-semibold text-card-foreground dark:text-white">{rec.name}</div>
                <div className="text-sm text-foreground/60 dark:text-white/50">
                  {rec.userId} &middot; {rec.class || "-"}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                    P:{rec.summary.present}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                    A:{rec.summary.absent}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                    L:{rec.summary.leave}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                    H:{rec.summary.holiday}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-foreground/60 dark:text-white/50 transition-transform ${
                    expandedUser === rec.userId ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2 text-xs mt-2">
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                P:{rec.summary.present}
              </span>
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                A:{rec.summary.absent}
              </span>
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                L:{rec.summary.leave}
              </span>
              <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                H:{rec.summary.holiday}
              </span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator className="my-3 bg-border dark:bg-white/10" />
            {/* Subject Summary */}
            {Object.keys(rec.subjectSummary).length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-medium text-foreground dark:text-white/80 mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#2F2FE4]" /> Subject-wise Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(rec.subjectSummary).map(
                    ([subject, counts]) => (
                      <div
                        key={subject}
                        className="text-xs bg-muted dark:bg-white/5 border border-border dark:border-white/5 rounded-xl p-3"
                      >
                        <div className="font-semibold text-card-foreground dark:text-white/80 mb-2">{subject}</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                            P:{counts.present}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                            A:{counts.absent}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            L:{counts.leave}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                            H:{counts.holiday}
                          </span>
                          {counts.noClass !== undefined && counts.noClass > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400">
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
                <div className="text-sm font-medium text-foreground dark:text-white/80 mb-2 flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5 text-[#2F2FE4]" /> QR Logs
                </div>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {rec.qrLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-foreground/60 dark:text-white/50 bg-muted dark:bg-white/5 rounded-lg px-3 py-1.5">
                        <span className="text-foreground/70 dark:text-white/70">{log.date}</span>
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
              <div className="text-sm font-medium text-foreground dark:text-white/80 mb-2">
                Daily Breakdown
              </div>
              <ScrollArea className="max-h-48">
                <div className="grid grid-cols-7 gap-1.5">
                  {Object.entries(rec.dailyStatus)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateStr, info]) => {
                      const day = dateStr.split("-")[2];
                      const statusColorMap: Record<string, string> = {
                        PRESENT: "bg-green-100 dark:bg-green-500/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
                        ABSENT: "bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
                        LEAVE: "bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
                        HOLIDAY: "bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
                        NO_CLASS: "bg-gray-100 dark:bg-gray-500/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20",
                      };
                      return (
                        <div
                          key={dateStr}
                          className={`text-center rounded-lg p-1.5 text-xs border ${
                            statusColorMap[info.status] || "bg-muted text-muted-foreground dark:bg-white/5 dark:text-white/40 border-border dark:border-white/5"
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
              <Label className="text-foreground/60 dark:text-white/60">Month (YYYY-MM)</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="dark:bg-white/5 dark:border-white/10 dark:text-white focus:border-[#2F2FE4]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/60 dark:text-white/60">Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="w-[150px] dark:bg-white/5 dark:border-white/10 dark:text-white">
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
              <Label className="text-foreground/60 dark:text-white/60">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] dark:bg-white/5 dark:border-white/10 dark:text-white">
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
            <Button
              onClick={downloadPDF}
              disabled={!report || pdfLoading}
              className="bg-[#2F2FE4] hover:bg-[#2424b8] text-white rounded-xl shadow-lg shadow-[#2F2FE4]/25 min-h-[44px]"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1.5">PDF</span>
            </Button>
          </div>
        </CardContent>
      </ThemedCard>

      {report && (allStudents.length > 0 || allTeachers.length > 0) && (
        <Tabs value={reportSection} onValueChange={setReportSection}>
          <TabsList className="dark:bg-white/5 bg-muted border dark:border-white/10 border-border">
            {allStudents.length > 0 && (
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg gap-1.5"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Students ({allStudents.length})
              </TabsTrigger>
            )}
            {allTeachers.length > 0 && (
              <TabsTrigger
                value="teachers"
                className="data-[state=active]:bg-[#2F2FE4] data-[state=active]:text-white text-foreground/60 dark:text-white/60 dark:data-[state=inactive]:text-white/60 rounded-lg gap-1.5"
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
          <CardContent className="py-12 text-center text-foreground/50 dark:text-white/40">
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
        <Loader2 className="h-8 w-8 animate-spin text-foreground/50 dark:text-white/40" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <ThemedCard>
        <CardHeader>
          <CardTitle
            className="text-base text-card-foreground dark:text-white flex items-center gap-2"
            style={{ background: "transparent" }}
          >
            <Settings className="h-4 w-4 text-[#2F2FE4]" /> Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-foreground/70 dark:text-white/70">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white">
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
            <Label className="text-foreground/70 dark:text-white/70">Time Format</Label>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-full dark:bg-white/5 dark:border-white/10 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-border dark:bg-white/10" />

          {/* Telegram Bot Token */}
          <div className="space-y-2">
            <Label className="text-foreground/70 dark:text-white/70" htmlFor="telegram-token">Telegram Bot Token</Label>
            <Input
              id="telegram-token"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="Enter Telegram bot token"
              className="dark:bg-white/5 dark:border-white/10 dark:text-white placeholder:text-muted-foreground dark:text-white/30 focus:border-[#2F2FE4]"
            />
            <p className="text-xs text-foreground/50 dark:text-white/40">
              Used for sending attendance notifications.
            </p>
          </div>

          <Separator className="bg-border dark:bg-white/10" />

          {/* Daily Report Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground/70 dark:text-white/70">Daily Report</Label>
              <p className="text-xs text-foreground/50 dark:text-white/40">
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
              <Label className="text-foreground/70 dark:text-white/70" htmlFor="report-time">Daily Report Time</Label>
              <Input
                id="report-time"
                type="time"
                value={dailyReportTime}
                onChange={(e) => setDailyReportTime(e.target.value)}
                className="dark:bg-white/5 dark:border-white/10 dark:text-white focus:border-[#2F2FE4]"
              />
            </div>
          )}

          <Separator className="bg-border dark:bg-white/10" />

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
