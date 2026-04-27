import { db } from "@/lib/db";
import {
  ATTENDANCE_STATUS,
  SUBJECT_ATTENDANCE_STATUS,
  getCurrentDateString,
  CLASS_SUBJECTS,
} from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// GET /api/reports/monthly?month=YYYY-MM&class=ClassName&role=STUDENT|TEACHER&userId=userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const className = searchParams.get("class");
    const role = searchParams.get("role")?.toUpperCase();
    const userId = searchParams.get("userId");

    if (!month) {
      return NextResponse.json(
        { error: "Month is required (YYYY-MM)" },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && role !== "STUDENT" && role !== "TEACHER") {
      return NextResponse.json(
        { error: "Role must be STUDENT or TEACHER" },
        { status: 400 }
      );
    }

    // Determine which reports to include (consistent with daily report logic)
    let includeStudentReport = false;
    let includeTeacherReport = false;

    if (className) {
      includeStudentReport = true;
    } else if (role === "TEACHER") {
      includeTeacherReport = true;
    } else if (role === "STUDENT") {
      includeStudentReport = true;
    } else {
      // No role, no class — return both
      includeStudentReport = true;
      includeTeacherReport = true;
    }

    const [year, mon] = month.split("-").map(Number);
    const startDate = `${month}-01`;
    const endDate = `${month}-${new Date(year, mon, 0).getDate().toString().padStart(2, "0")}`;

    // Get settings
    const settings = await db.settings.findFirst();
    const timezone = settings?.timezone || "Asia/Kolkata";

    // Determine today's date in the configured timezone
    const todayStr = getCurrentDateString(timezone);

    // Build user where clause
    const userWhere: Record<string, unknown> = {};
    if (userId) userWhere.userId = userId;
    if (className) {
      userWhere.class = className;
      userWhere.role = "STUDENT";
    } else if (role === "STUDENT") {
      userWhere.role = "STUDENT";
    } else if (role === "TEACHER") {
      userWhere.role = "TEACHER";
    }

    const users = await db.user.findMany({
      where: Object.keys(userWhere).length > 0 ? userWhere : {},
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    const students = users.filter((u) => u.role === "STUDENT");
    const teachers = users.filter((u) => u.role === "TEACHER");

    // Get attendance for the month
    const attendanceWhere: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
    };
    if (userId) attendanceWhere.userId = userId;
    // Filter by role-specific user IDs to reduce data
    if (includeStudentReport && !includeTeacherReport) {
      attendanceWhere.userId = { in: students.map((s) => s.userId) };
    } else if (includeTeacherReport && !includeStudentReport) {
      attendanceWhere.userId = { in: teachers.map((t) => t.userId) };
    }

    const attendance = await db.attendance.findMany({
      where: attendanceWhere,
    });

    // Get subject attendance for the month
    const subjectAttendance = await db.subjectAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userId ? { userId } : {}),
      },
    });

    // Get holidays for the month
    const holidays = await db.holiday.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    });

    // Get approved leave requests overlapping with this month
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: endDate },
        toDate: { gte: startDate },
        ...(userId ? { userId } : {}),
      },
    });

    // Helper: check if date is holiday for a specific class
    function isHolidayForClass(dateStr: string, cls: string | null): boolean {
      return holidays.some((h) => {
        if (h.date !== dateStr) return false;
        const hClasses: string[] = JSON.parse(h.classes);
        return hClasses.includes("ALL") || (cls && hClasses.includes(cls));
      });
    }

    // Helper: determine overall status with priority HOLIDAY > LEAVE > PRESENT > ABSENT
    function determineStatus(
      isHoliday: boolean,
      onLeave: boolean,
      hasCheckIn: boolean
    ): string {
      if (isHoliday) return ATTENDANCE_STATUS.HOLIDAY;
      if (onLeave) return ATTENDANCE_STATUS.LEAVE;
      if (hasCheckIn) return ATTENDANCE_STATUS.PRESENT;
      return ATTENDANCE_STATUS.ABSENT;
    }

    // Helper: determine subject status with holiday/leave override
    function determineSubjectStatus(
      isHoliday: boolean,
      onLeave: boolean,
      rawStatus: string
    ): string {
      if (isHoliday) return SUBJECT_ATTENDANCE_STATUS.HOLIDAY;
      if (onLeave) return SUBJECT_ATTENDANCE_STATUS.LEAVE;
      return rawStatus;
    }

    // Helper: format time for QR log display
    function formatTimeForQrLog(date: Date | null): string | null {
      if (!date) return null;
      try {
        return date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: timezone,
        });
      } catch {
        return date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    // Build student report
    const studentReport = includeStudentReport
      ? students.map((student) => {
          const userAttendance = attendance.filter(
            (a) => a.userId === student.userId
          );
          const userSubjectAttendance = subjectAttendance.filter(
            (sa) => sa.userId === student.userId
          );
          const userLeaves = leaveRequests.filter(
            (l) => l.userId === student.userId
          );

          const daysInMonth = new Date(year, mon, 0).getDate();
          const dailyStatus: Record<
            string,
            { status: string; checkIn?: string | null; checkOut?: string | null }
          > = {};

          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${month}-${d.toString().padStart(2, "0")}`;

            // Skip future dates — don't count them as ABSENT
            if (dateStr > todayStr) continue;

            const dayAttendance = userAttendance.find(
              (a) => a.date === dateStr
            );
            const isHoliday = isHolidayForClass(dateStr, student.class);
            const onLeave = userLeaves.some(
              (l) => l.fromDate <= dateStr && l.toDate >= dateStr
            );

            const status = determineStatus(
              isHoliday,
              onLeave,
              !!dayAttendance?.checkIn
            );

            dailyStatus[dateStr] = {
              status,
              checkIn: dayAttendance?.checkIn?.toISOString() || null,
              checkOut: dayAttendance?.checkOut?.toISOString() || null,
            };
          }

          // Summary from dailyStatus (only past/today dates)
          const values = Object.values(dailyStatus);
          const summary = {
            totalDays: values.length,
            present: values.filter((v) => v.status === ATTENDANCE_STATUS.PRESENT).length,
            absent: values.filter((v) => v.status === ATTENDANCE_STATUS.ABSENT).length,
            leave: values.filter((v) => v.status === ATTENDANCE_STATUS.LEAVE).length,
            holiday: values.filter((v) => v.status === ATTENDANCE_STATUS.HOLIDAY).length,
          };

          // Subject-wise summary — include noClass count
          const classSubjects =
            (student.class ? CLASS_SUBJECTS[student.class] : null) || [];
          const subjectSummary: Record<
            string,
            { present: number; absent: number; leave: number; holiday: number; noClass: number }
          > = {};

          classSubjects.forEach((subj) => {
            subjectSummary[subj] = { present: 0, absent: 0, leave: 0, holiday: 0, noClass: 0 };

            // Iterate through each day for this subject
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${month}-${d.toString().padStart(2, "0")}`;
              if (dateStr > todayStr) continue;

              const isHoliday = isHolidayForClass(dateStr, student.class);
              const onLeave = userLeaves.some(
                (l) => l.fromDate <= dateStr && l.toDate >= dateStr
              );

              const sa = userSubjectAttendance.find(
                (s) => s.date === dateStr && s.subject === subj
              );

              const finalStatus = determineSubjectStatus(
                isHoliday,
                onLeave,
                sa?.status || SUBJECT_ATTENDANCE_STATUS.ABSENT
              );

              const key = finalStatus === "NO_CLASS" ? "noClass" : finalStatus.toLowerCase() as keyof typeof subjectSummary[string];
              if (key in subjectSummary[subj]) {
                subjectSummary[subj][key]++;
              }
            }
          });

          // QR logs — dates with check-in/check-out times
          const qrLogs = userAttendance
            .filter((a) => a.checkIn)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((a) => ({
              date: a.date,
              checkIn: formatTimeForQrLog(a.checkIn),
              checkOut: formatTimeForQrLog(a.checkOut),
            }));

          return {
            userId: student.userId,
            name: student.name,
            class: student.class,
            summary,
            subjectSummary,
            qrLogs,
            dailyStatus,
          };
        })
      : undefined;

    // Build teacher report
    const teacherReport = includeTeacherReport
      ? teachers.map((teacher) => {
          const userAttendance = attendance.filter(
            (a) => a.userId === teacher.userId
          );
          const userSubjectAttendance = subjectAttendance.filter(
            (sa) => sa.userId === teacher.userId
          );
          const userLeaves = leaveRequests.filter(
            (l) => l.userId === teacher.userId
          );

          // Get teacher's subjects
          let teacherSubjects: string[] = [];
          if (teacher.subjects) {
            try {
              teacherSubjects = JSON.parse(teacher.subjects);
            } catch {
              teacherSubjects = [];
            }
          }

          const daysInMonth = new Date(year, mon, 0).getDate();
          const dailyStatus: Record<
            string,
            { status: string; checkIn?: string | null; checkOut?: string | null }
          > = {};

          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${month}-${d.toString().padStart(2, "0")}`;

            // Skip future dates
            if (dateStr > todayStr) continue;

            const dayAttendance = userAttendance.find(
              (a) => a.date === dateStr
            );
            // For teachers, check holiday with ALL class
            const isHoliday = isHolidayForClass(dateStr, null);
            const onLeave = userLeaves.some(
              (l) => l.fromDate <= dateStr && l.toDate >= dateStr
            );

            const status = determineStatus(
              isHoliday,
              onLeave,
              !!dayAttendance?.checkIn
            );

            dailyStatus[dateStr] = {
              status,
              checkIn: dayAttendance?.checkIn?.toISOString() || null,
              checkOut: dayAttendance?.checkOut?.toISOString() || null,
            };
          }

          // Summary
          const values = Object.values(dailyStatus);
          const summary = {
            totalDays: values.length,
            present: values.filter((v) => v.status === ATTENDANCE_STATUS.PRESENT).length,
            absent: values.filter((v) => v.status === ATTENDANCE_STATUS.ABSENT).length,
            leave: values.filter((v) => v.status === ATTENDANCE_STATUS.LEAVE).length,
            holiday: values.filter((v) => v.status === ATTENDANCE_STATUS.HOLIDAY).length,
          };

          // Subject-wise summary for teacher
          const subjectSummary: Record<
            string,
            { present: number; absent: number; leave: number; holiday: number; noClass: number }
          > = {};

          teacherSubjects.forEach((subj) => {
            subjectSummary[subj] = { present: 0, absent: 0, leave: 0, holiday: 0, noClass: 0 };

            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${month}-${d.toString().padStart(2, "0")}`;
              if (dateStr > todayStr) continue;

              const isHoliday = isHolidayForClass(dateStr, null);
              const onLeave = userLeaves.some(
                (l) => l.fromDate <= dateStr && l.toDate >= dateStr
              );

              const sa = userSubjectAttendance.find(
                (s) => s.date === dateStr && s.subject === subj
              );

              const finalStatus = determineSubjectStatus(
                isHoliday,
                onLeave,
                sa?.status || SUBJECT_ATTENDANCE_STATUS.ABSENT
              );

              const key = finalStatus === "NO_CLASS" ? "noClass" : finalStatus.toLowerCase() as keyof typeof subjectSummary[string];
              if (key in subjectSummary[subj]) {
                subjectSummary[subj][key]++;
              }
            }
          });

          // QR logs
          const qrLogs = userAttendance
            .filter((a) => a.checkIn)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((a) => ({
              date: a.date,
              checkIn: formatTimeForQrLog(a.checkIn),
              checkOut: formatTimeForQrLog(a.checkOut),
            }));

          return {
            userId: teacher.userId,
            name: teacher.name,
            summary,
            subjectSummary,
            qrLogs,
            dailyStatus,
          };
        })
      : undefined;

    const response: Record<string, unknown> = {
      month,
      timezone,
    };

    if (studentReport !== undefined) {
      response.studentReport = studentReport;
    }
    if (teacherReport !== undefined) {
      response.teacherReport = teacherReport;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly report" },
      { status: 400 }
    );
  }
}
