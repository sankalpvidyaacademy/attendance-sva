import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LEAVE_STATUS, ATTENDANCE_STATUS, SUBJECT_ATTENDANCE_STATUS, CLASS_SUBJECTS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const leaveRequests = await db.leaveRequest.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leaveRequests });
  } catch (error) {
    console.error("Get leave requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fromDate, toDate, remark } = body;

    if (!userId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "userId, fromDate, and toDate are required" },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await db.user.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate date range
    if (fromDate > toDate) {
      return NextResponse.json(
        { error: "fromDate must be before or equal to toDate" },
        { status: 400 }
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        userId,
        fromDate,
        toDate,
        remark,
        status: LEAVE_STATUS.PENDING,
      },
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
    });

    return NextResponse.json({ leaveRequest }, { status: 201 });
  } catch (error) {
    console.error("Apply leave error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, reviewedBy } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    if (status !== LEAVE_STATUS.APPROVED && status !== LEAVE_STATUS.REJECTED) {
      return NextResponse.json(
        { error: "status must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Get existing leave request
    const leaveRequest = await db.leaveRequest.findUnique({
      where: { id },
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
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== LEAVE_STATUS.PENDING) {
      return NextResponse.json(
        { error: "Leave request has already been reviewed" },
        { status: 400 }
      );
    }

    // Update the leave request
    const updated = await db.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy,
      },
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
    });

    // If APPROVED: update attendance and subject attendance for each date in range
    if (status === LEAVE_STATUS.APPROVED) {
      const fromDate = new Date(leaveRequest.fromDate);
      const toDate = new Date(leaveRequest.toDate);
      const userId = leaveRequest.userId;

      const dates: string[] = [];
      const current = new Date(fromDate);
      while (current <= toDate) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }

      // Get user's class and subjects
      const user = await db.user.findUnique({ where: { userId } });
      const userClass = user?.class;
      const subjects = userClass ? (CLASS_SUBJECTS[userClass] || []) : [];

      for (const dateStr of dates) {
        // Update/create attendance record with status LEAVE
        await db.attendance.upsert({
          where: {
            userId_date: { userId, date: dateStr },
          },
          create: {
            userId,
            date: dateStr,
            status: ATTENDANCE_STATUS.LEAVE,
          },
          update: {
            status: ATTENDANCE_STATUS.LEAVE,
          },
        });

        // Update subject attendance for that user on those dates to LEAVE
        for (const subject of subjects) {
          await db.subjectAttendance.upsert({
            where: {
              userId_date_subject: { userId, date: dateStr, subject },
            },
            create: {
              userId,
              date: dateStr,
              subject,
              status: SUBJECT_ATTENDANCE_STATUS.LEAVE,
            },
            update: {
              status: SUBJECT_ATTENDANCE_STATUS.LEAVE,
            },
          });
        }
      }
    }

    return NextResponse.json({ leaveRequest: updated });
  } catch (error) {
    console.error("Review leave error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
