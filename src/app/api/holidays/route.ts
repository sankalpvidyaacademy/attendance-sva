import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS, SUBJECT_ATTENDANCE_STATUS, CLASS_SUBJECTS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month"); // YYYY-MM
    const classFilter = searchParams.get("class");

    const where: Record<string, unknown> = {};

    if (date) {
      where.date = date;
    } else if (month) {
      // month is YYYY-MM, so we want dates starting with that prefix
      const startDate = `${month}-01`;
      const [year, mon] = month.split("-").map(Number);
      const nextMonth = mon === 12 ? 1 : mon + 1;
      const nextYear = mon === 12 ? year + 1 : year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
      where.date = { gte: startDate, lt: endDate };
    }

    let holidays = await db.holiday.findMany({
      where,
      orderBy: { date: "desc" },
    });

    // If class filter, filter holidays where classes includes the class or "ALL"
    if (classFilter) {
      holidays = holidays.filter((holiday) => {
        try {
          const classes: string[] = JSON.parse(holiday.classes);
          return classes.includes("ALL") || classes.includes(classFilter);
        } catch {
          return true; // Include if parsing fails
        }
      });
    }

    // Parse classes JSON for response
    const formattedHolidays = holidays.map((holiday) => ({
      ...holiday,
      classes: JSON.parse(holiday.classes),
    }));

    return NextResponse.json({ holidays: formattedHolidays });
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, classes, remark } = body;

    if (!date || !classes || !Array.isArray(classes) || classes.length === 0) {
      return NextResponse.json(
        { error: "date and classes (non-empty array) are required" },
        { status: 400 }
      );
    }

    const classesJson = JSON.stringify(classes);

    const holiday = await db.holiday.create({
      data: {
        date,
        classes: classesJson,
        remark,
      },
    });

    // Update attendance and subject attendance for affected users on that date
    // Find users in the affected classes
    const affectsAll = classes.includes("ALL");

    const userWhere: Record<string, unknown> = {};
    if (!affectsAll) {
      userWhere.class = { in: classes };
    }

    const affectedUsers = await db.user.findMany({
      where: userWhere,
      select: { userId: true, class: true },
    });

    for (const user of affectedUsers) {
      // Update/create attendance with HOLIDAY status
      await db.attendance.upsert({
        where: {
          userId_date: { userId: user.userId, date },
        },
        create: {
          userId: user.userId,
          date,
          status: ATTENDANCE_STATUS.HOLIDAY,
        },
        update: {
          status: ATTENDANCE_STATUS.HOLIDAY,
        },
      });

      // Update subject attendance
      const subjects = user.class ? (CLASS_SUBJECTS[user.class] || []) : [];
      for (const subject of subjects) {
        await db.subjectAttendance.upsert({
          where: {
            userId_date_subject: { userId: user.userId, date, subject },
          },
          create: {
            userId: user.userId,
            date,
            subject,
            status: SUBJECT_ATTENDANCE_STATUS.HOLIDAY,
          },
          update: {
            status: SUBJECT_ATTENDANCE_STATUS.HOLIDAY,
          },
        });
      }
    }

    return NextResponse.json(
      {
        holiday: {
          ...holiday,
          classes: JSON.parse(holiday.classes),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create holiday error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const holiday = await db.holiday.findUnique({ where: { id } });
    if (!holiday) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    await db.holiday.delete({ where: { id } });

    // Note: Do NOT revert attendance records (they would need to be recalculated)

    return NextResponse.json({
      success: true,
      message: "Holiday deleted. Attendance records were not reverted.",
    });
  } catch (error) {
    console.error("Delete holiday error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
