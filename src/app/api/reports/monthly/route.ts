import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/reports/monthly?month=YYYY-MM&class=ClassName&userId=userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const className = searchParams.get("class");
    const userId = searchParams.get("userId");

    if (!month) {
      return NextResponse.json({ error: "Month is required (YYYY-MM)" }, { status: 400 });
    }

    const [year, mon] = month.split("-").map(Number);
    const startDate = `${month}-01`;
    const endDate = `${month}-${new Date(year, mon, 0).getDate().toString().padStart(2, "0")}`;

    // Get settings
    const settings = await db.settings.findFirst();
    const timezone = settings?.timezone || "Asia/Kolkata";

    // Get users
    const whereClause: Record<string, unknown> = {};
    if (userId) whereClause.userId = userId;
    if (className) {
      whereClause.class = className;
      whereClause.role = "STUDENT";
    }

    const users = await db.user.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : { role: "STUDENT" },
      orderBy: [{ name: "asc" }],
    });

    // Get attendance for the month
    const attendance = await db.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userId ? { userId } : {}),
      },
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
      },
    });

    // Build report per user
    const report = users.map((user) => {
      const userAttendance = attendance.filter((a) => a.userId === user.userId);
      const userSubjectAttendance = subjectAttendance.filter(
        (sa) => sa.userId === user.userId
      );
      const userLeaves = leaveRequests.filter((l) => l.userId === user.userId);

      const daysInMonth = new Date(year, mon, 0).getDate();
      const dailyStatus: Record<string, { status: string; checkIn?: string | null; checkOut?: string | null }> = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${month}-${d.toString().padStart(2, "0")}`;
        const dayAttendance = userAttendance.find((a) => a.date === dateStr);

        // Check holiday
        const dayHoliday = holidays.find((h) => {
          const hClasses: string[] = JSON.parse(h.classes);
          return h.date === dateStr && (hClasses.includes("ALL") || (user.class && hClasses.includes(user.class)));
        });

        // Check leave
        const onLeave = userLeaves.some(
          (l) => l.fromDate <= dateStr && l.toDate >= dateStr
        );

        let status = "ABSENT";
        if (dayHoliday) {
          status = "HOLIDAY";
        } else if (onLeave) {
          status = "LEAVE";
        } else if (dayAttendance?.checkIn) {
          status = "PRESENT";
        }

        dailyStatus[dateStr] = {
          status,
          checkIn: dayAttendance?.checkIn?.toISOString() || null,
          checkOut: dayAttendance?.checkOut?.toISOString() || null,
        };
      }

      // Summary
      const values = Object.values(dailyStatus);
      const summary = {
        totalDays: daysInMonth,
        present: values.filter((v) => v.status === "PRESENT").length,
        absent: values.filter((v) => v.status === "ABSENT").length,
        leave: values.filter((v) => v.status === "LEAVE").length,
        holiday: values.filter((v) => v.status === "HOLIDAY").length,
      };

      // Subject-wise summary
      const subjectSummary: Record<string, { present: number; absent: number; leave: number; holiday: number }> = {};
      userSubjectAttendance.forEach((sa) => {
        if (!subjectSummary[sa.subject]) {
          subjectSummary[sa.subject] = { present: 0, absent: 0, leave: 0, holiday: 0 };
        }
        const key = sa.status.toLowerCase() as keyof typeof subjectSummary[string];
        if (key in subjectSummary[sa.subject]) {
          subjectSummary[sa.subject][key]++;
        }
      });

      return {
        userId: user.userId,
        name: user.name,
        role: user.role,
        class: user.class,
        summary,
        subjectSummary,
        dailyStatus,
      };
    });

    return NextResponse.json({
      month,
      timezone,
      report,
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json({ error: "Failed to generate monthly report" }, { status: 500 });
  }
}
