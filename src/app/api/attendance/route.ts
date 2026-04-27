import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const role = searchParams.get("role");
    const classFilter = searchParams.get("class");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.date = { gte: startDate };
    } else if (endDate) {
      where.date = { lte: endDate };
    }

    // If role or class filter, find matching users first
    let userIds: string[] | null = null;
    if (role || classFilter) {
      const userWhere: Record<string, unknown> = {};
      if (role) userWhere.role = role;
      if (classFilter) userWhere.class = classFilter;

      const users = await db.user.findMany({
        where: userWhere,
        select: { userId: true },
      });
      userIds = users.map((u) => u.userId);

      if (userIds.length === 0) {
        return NextResponse.json({ records: [] });
      }

      where.userId = { in: userIds };
    }

    // Get attendance records with user info
    const records = await db.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            userId: true,
            role: true,
            class: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Get all unique dates from records to check holidays
    const dates = [...new Set(records.map((r) => r.date))];

    // Check holidays for these dates
    const holidays = await db.holiday.findMany({
      where: {
        date: { in: dates },
      },
    });

    // Check approved leaves for these users in the date range
    const recordUserIds = [...new Set(records.map((r) => r.userId))];
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        userId: { in: recordUserIds },
        status: "APPROVED",
      },
    });

    // Build a set of (userId, date) combos that have approved leave
    const leaveSet = new Set<string>();
    for (const leave of approvedLeaves) {
      const current = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        leaveSet.add(`${leave.userId}:${dateStr}`);
        current.setDate(current.getDate() + 1);
      }
    }

    // Build a map of date -> holiday classes
    const holidayMap = new Map<string, string[]>();
    for (const h of holidays) {
      try {
        const classes: string[] = JSON.parse(h.classes);
        holidayMap.set(h.date, classes);
      } catch {
        holidayMap.set(h.date, ["ALL"]);
      }
    }

    // Format records with status overrides
    const formattedRecords = records.map((record) => {
      let status = record.status;

      // Check if date is a holiday
      const holidayClasses = holidayMap.get(record.date);
      if (holidayClasses) {
        const appliesToAll = holidayClasses.includes("ALL");
        const appliesToUser =
          appliesToAll ||
          (record.user.class && holidayClasses.includes(record.user.class));
        if (appliesToUser) {
          status = ATTENDANCE_STATUS.HOLIDAY;
        }
      }

      // Check if user has approved leave for that date (only if not holiday)
      if (status !== ATTENDANCE_STATUS.HOLIDAY) {
        const leaveKey = `${record.userId}:${record.date}`;
        if (leaveSet.has(leaveKey)) {
          status = ATTENDANCE_STATUS.LEAVE;
        }
      }

      return {
        id: record.id,
        userId: record.userId,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        status,
        lastScanAt: record.lastScanAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        user: record.user,
      };
    });

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
