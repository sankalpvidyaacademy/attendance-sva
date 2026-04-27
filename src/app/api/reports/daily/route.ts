import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/reports/daily?date=YYYY-MM-DD&class=ClassName
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const className = searchParams.get("class");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Get settings for timezone
    const settings = await db.settings.findFirst();
    const timezone = settings?.timezone || "Asia/Kolkata";

    // Get holidays for this date
    const holidays = await db.holiday.findMany({
      where: { date },
    });

    // Check if this date is a holiday for the given class
    const isHoliday = holidays.some((h) => {
      const classes: string[] = JSON.parse(h.classes);
      return classes.includes("ALL") || (className && classes.includes(className));
    });
    const holidayRemark = isHoliday
      ? holidays.find((h) => {
          const classes: string[] = JSON.parse(h.classes);
          return classes.includes("ALL") || (className && classes.includes(className));
        })?.remark
      : null;

    // Get users (students and teachers)
    const whereClause: Record<string, unknown> = {};
    if (className) {
      whereClause.class = className;
      whereClause.role = "STUDENT";
    }

    const users = await db.user.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : {},
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    // Get attendance for this date
    const attendance = await db.attendance.findMany({
      where: { date },
    });

    // Get subject attendance for this date
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

    // Build report
    const report = users.map((user) => {
      const userAttendance = attendance.find((a) => a.userId === user.userId);
      const userSubjectAttendance = subjectAttendance.filter(
        (sa) => sa.userId === user.userId
      );

      // Determine status with priority
      let status = "ABSENT";
      if (isHoliday) {
        status = "HOLIDAY";
      } else if (leaveUserIds.has(user.userId)) {
        status = "LEAVE";
      } else if (userAttendance?.checkIn) {
        status = "PRESENT";
      }

      return {
        userId: user.userId,
        name: user.name,
        role: user.role,
        class: user.class,
        status,
        checkIn: userAttendance?.checkIn,
        checkOut: userAttendance?.checkOut,
        holidayRemark,
        subjects: userSubjectAttendance.map((sa) => ({
          subject: sa.subject,
          status: isHoliday ? "HOLIDAY" : leaveUserIds.has(user.userId) ? "LEAVE" : sa.status,
        })),
      };
    });

    // Summary
    const summary = {
      total: report.length,
      present: report.filter((r) => r.status === "PRESENT").length,
      absent: report.filter((r) => r.status === "ABSENT").length,
      leave: report.filter((r) => r.status === "LEAVE").length,
      holiday: report.filter((r) => r.status === "HOLIDAY").length,
    };

    return NextResponse.json({
      date,
      isHoliday,
      holidayRemark,
      timezone,
      summary,
      report,
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ error: "Failed to generate daily report" }, { status: 500 });
  }
}
