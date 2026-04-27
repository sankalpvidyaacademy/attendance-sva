import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SUBJECT_ATTENDANCE_STATUS, CLASS_SUBJECTS } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const subject = searchParams.get("subject");

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (date) where.date = date;
    if (subject) where.subject = subject;

    const records = await db.subjectAttendance.findMany({
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
      orderBy: [{ date: "desc" }, { subject: "asc" }],
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get subject attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date, subject, status, markedBy } = body;

    if (!userId || !date || !subject || !status) {
      return NextResponse.json(
        { error: "userId, date, subject, and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = Object.values(SUBJECT_ATTENDANCE_STATUS);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert: create or update subject attendance
    const record = await db.subjectAttendance.upsert({
      where: {
        userId_date_subject: { userId, date, subject },
      },
      create: {
        userId,
        date,
        subject,
        status,
        markedBy,
      },
      update: {
        status,
        markedBy: markedBy || undefined,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Mark subject attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { date, subject, subjects, class: className, status, markedBy, studentIds } = body;

    // Support both single subject (string) and multiple subjects (string[])
    const subjectList: string[] = subjects
      ? Array.isArray(subjects) ? subjects : [subjects]
      : subject
        ? [subject]
        : [];

    if (!date || subjectList.length === 0 || !className || !status) {
      return NextResponse.json(
        { error: "date, subject(s), class, and status are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = Object.values(SUBJECT_ATTENDANCE_STATUS);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get students - either specific IDs or all in the class
    let targetStudentIds = studentIds;
    if (!targetStudentIds || targetStudentIds.length === 0) {
      const students = await db.user.findMany({
        where: { class: className, role: "STUDENT" },
        select: { userId: true },
      });
      targetStudentIds = students.map((s) => s.userId);
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json(
        { error: "No students found for the specified class" },
        { status: 404 }
      );
    }

    // Bulk upsert subject attendance for each student × each subject
    const results = [];
    for (const studentId of targetStudentIds) {
      for (const subj of subjectList) {
        const record = await db.subjectAttendance.upsert({
          where: {
            userId_date_subject: { userId: studentId, date, subject: subj },
          },
          create: {
            userId: studentId,
            date,
            subject: subj,
            status,
            markedBy,
          },
          update: {
            status,
            markedBy: markedBy || undefined,
          },
        });
        results.push(record);
      }
    }

    return NextResponse.json({
      count: results.length,
      records: results,
    });
  } catch (error) {
    console.error("Bulk mark subject attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
