import { db } from "@/lib/db";
import {
  ATTENDANCE_STATUS,
  SUBJECT_ATTENDANCE_STATUS,
  getCurrentDateString,
  CLASS_SUBJECTS,
} from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

// GET /api/reports/daily?date=YYYY-MM-DD&class=ClassName&role=STUDENT|TEACHER
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const className = searchParams.get("class");
    const role = searchParams.get("role")?.toUpperCase();

    if (!date) {
      return NextResponse.json(
        { error: "Date is required (YYYY-MM-DD)" },
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

    // Determine which reports to include
    // When role not specified and no class filter: return both
    // When role=STUDENT or class is specified: only studentReport
    // When role=TEACHER: only teacherReport
    // Default to STUDENT when no class specified and no role
    let includeStudentReport = false;
    let includeTeacherReport = false;

    if (className) {
      // Class filter always means student report only
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

    // Get settings for timezone
    const settings = await db.settings.findFirst();
    const timezone = settings?.timezone || "Asia/Kolkata";

    // Get holidays for this date
    const holidays = await db.holiday.findMany({
      where: { date },
    });

    // Get all attendance records for this date
    const attendance = await db.attendance.findMany({
      where: { date },
    });

    // Get all subject attendance for this date
    const subjectAttendance = await db.subjectAttendance.findMany({
      where: { date },
    });

    // Get approved leave requests covering this date
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: date },
        toDate: { gte: date },
      },
    });

    const leaveUserIds = new Set(leaveRequests.map((l) => l.userId));

    // Fetch all users for QR log name resolution
    const allUsers = await db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    // Build user map for quick lookup
    const userMap = new Map(allUsers.map((u) => [u.userId, u]));

    // Build QR logs — all attendance records for that date with checkIn/checkOut
    const qrLogs = attendance
      .filter((a) => a.checkIn)
      .map((a) => {
        const user = userMap.get(a.userId);
        return {
          userId: a.userId,
          name: user?.name || "Unknown",
          role: user?.role || "UNKNOWN",
          checkIn: a.checkIn?.toISOString() || null,
          checkOut: a.checkOut?.toISOString() || null,
          status: a.status,
        };
      });

    // Now filter users for report generation based on query params
    const userWhere: Record<string, unknown> = {};
    if (className) {
      userWhere.class = className;
      userWhere.role = "STUDENT";
    } else if (role === "STUDENT") {
      userWhere.role = "STUDENT";
    } else if (role === "TEACHER") {
      userWhere.role = "TEACHER";
    }

    const users = Object.keys(userWhere).length > 0
      ? allUsers.filter((u) => {
          if (userWhere.class && u.class !== userWhere.class) return false;
          if (userWhere.role && u.role !== userWhere.role) return false;
          return true;
        })
      : allUsers;

    // Separate students and teachers
    const students = users.filter((u) => u.role === "STUDENT");
    const teachers = users.filter((u) => u.role === "TEACHER");

    // Helper: check if date is holiday for a specific class
    function isHolidayForClass(cls: string | null): {
      isHoliday: boolean;
      remark: string | null;
    } {
      const holiday = holidays.find((h) => {
        const hClasses: string[] = JSON.parse(h.classes);
        return hClasses.includes("ALL") || (cls && hClasses.includes(cls));
      });
      return {
        isHoliday: !!holiday,
        remark: holiday?.remark || null,
      };
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

    // Build student report
    const studentReport = includeStudentReport
      ? students.map((student) => {
          const userAttendance = attendance.find(
            (a) => a.userId === student.userId
          );
          const userSubjectAttendance = subjectAttendance.filter(
            (sa) => sa.userId === student.userId
          );
          const onLeave = leaveUserIds.has(student.userId);
          const { isHoliday: isStudentHoliday } = isHolidayForClass(
            student.class
          );

          const status = determineStatus(
            isStudentHoliday,
            onLeave,
            !!userAttendance?.checkIn
          );

          // Get subjects for this student's class
          const classSubjects =
            (student.class ? CLASS_SUBJECTS[student.class] : null) || [];

          // Build subject-wise attendance
          const subjects = classSubjects.map((subj) => {
            const sa = userSubjectAttendance.find((s) => s.subject === subj);
            const rawStatus = sa?.status || SUBJECT_ATTENDANCE_STATUS.ABSENT;
            return {
              subject: subj,
              status: determineSubjectStatus(isStudentHoliday, onLeave, rawStatus),
            };
          });

          return {
            userId: student.userId,
            name: student.name,
            class: student.class,
            status,
            checkIn: userAttendance?.checkIn?.toISOString() || null,
            checkOut: userAttendance?.checkOut?.toISOString() || null,
            subjects,
          };
        })
      : undefined;

    // Build teacher report
    const teacherReport = includeTeacherReport
      ? teachers.map((teacher) => {
          const userAttendance = attendance.find(
            (a) => a.userId === teacher.userId
          );
          const userSubjectAttendance = subjectAttendance.filter(
            (sa) => sa.userId === teacher.userId
          );
          const onLeave = leaveUserIds.has(teacher.userId);
          // Teachers don't have a class filter for holidays — use ALL check
          const { isHoliday: isTeacherHoliday } = isHolidayForClass(null);

          const status = determineStatus(
            isTeacherHoliday,
            onLeave,
            !!userAttendance?.checkIn
          );

          // Teacher subjects from their subjects JSON field
          let teacherSubjects: string[] = [];
          if (teacher.subjects) {
            try {
              teacherSubjects = JSON.parse(teacher.subjects);
            } catch {
              teacherSubjects = [];
            }
          }

          // Build subject-wise attendance for teacher
          const subjects = teacherSubjects.map((subj) => {
            const sa = userSubjectAttendance.find((s) => s.subject === subj);
            const rawStatus = sa?.status || SUBJECT_ATTENDANCE_STATUS.ABSENT;
            return {
              subject: subj,
              status: determineSubjectStatus(
                isTeacherHoliday,
                onLeave,
                rawStatus
              ),
            };
          });

          return {
            userId: teacher.userId,
            name: teacher.name,
            status,
            checkIn: userAttendance?.checkIn?.toISOString() || null,
            checkOut: userAttendance?.checkOut?.toISOString() || null,
            subjects,
          };
        })
      : undefined;

    // Build summary from all applicable users
    const allReportEntries: { status: string }[] = [];
    if (studentReport) {
      allReportEntries.push(...studentReport);
    }
    if (teacherReport) {
      allReportEntries.push(...teacherReport);
    }

    const summary = {
      total: allReportEntries.length,
      present: allReportEntries.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length,
      absent: allReportEntries.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
      leave: allReportEntries.filter((r) => r.status === ATTENDANCE_STATUS.LEAVE).length,
      holiday: allReportEntries.filter((r) => r.status === ATTENDANCE_STATUS.HOLIDAY).length,
    };

    // Determine overall holiday status for the date (for the top-level response)
    // If class filter is applied, check holiday for that class; otherwise check ALL
    const { isHoliday, remark: holidayRemark } = className
      ? isHolidayForClass(className)
      : isHolidayForClass(null);

    const response: Record<string, unknown> = {
      date,
      timezone,
      isHoliday,
      holidayRemark,
      summary,
      qrLogs,
    };

    if (studentReport !== undefined) {
      response.studentReport = studentReport;
    }
    if (teacherReport !== undefined) {
      response.teacherReport = teacherReport;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json(
      { error: "Failed to generate daily report" },
      { status: 500 }
    );
  }
}
