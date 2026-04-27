import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ROLES,
  ATTENDANCE_STATUS,
  getCurrentDateString,
  formatTime,
  formatDate,
} from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date: dateParam } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({ where: { userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get settings for timezone
    const settings = await db.settings.findFirst();
    const timezone = settings?.timezone || "Asia/Kolkata";
    const timeFormat = settings?.timeFormat || "12h";

    // Get current date
    const date = dateParam || getCurrentDateString(timezone);
    const now = new Date();

    // 5-second scan protection: check lastScanAt
    const existingRecord = await db.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (existingRecord?.lastScanAt) {
      const timeSinceLastScan =
        now.getTime() - new Date(existingRecord.lastScanAt).getTime();
      if (timeSinceLastScan < 5000) {
        return NextResponse.json(
          {
            error: `Please wait ${Math.ceil((5000 - timeSinceLastScan) / 1000)} seconds before scanning again`,
          },
          { status: 429 }
        );
      }
    }

    let attendance;
    let isCheckIn = false;
    let isCheckOut = false;

    if (!existingRecord) {
      // No record exists: create with checkIn = now, status = PRESENT
      attendance = await db.attendance.create({
        data: {
          userId,
          date,
          checkIn: now,
          status: ATTENDANCE_STATUS.PRESENT,
          lastScanAt: now,
        },
      });
      isCheckIn = true;
    } else if (existingRecord.checkIn && !existingRecord.checkOut) {
      // Record exists with checkIn but no checkOut: set checkOut = now
      attendance = await db.attendance.update({
        where: { id: existingRecord.id },
        data: {
          checkOut: now,
          lastScanAt: now,
        },
      });
      isCheckOut = true;
    } else if (existingRecord.checkIn && existingRecord.checkOut) {
      // Already checked out
      return NextResponse.json(
        { error: "Already checked out" },
        { status: 400 }
      );
    } else {
      // Edge case: record exists with no checkIn (e.g., created as ABSENT)
      // Set checkIn
      attendance = await db.attendance.update({
        where: { id: existingRecord.id },
        data: {
          checkIn: now,
          status: ATTENDANCE_STATUS.PRESENT,
          lastScanAt: now,
        },
      });
      isCheckIn = true;
    }

    // Send Telegram notification if user has chatId
    if (user.chatId) {
      try {
        const timeStr = formatTime(now, timeFormat, timezone);
        const dateStr = formatDate(now, timezone);

        let message: string;
        if (isCheckIn) {
          message = `✅ Check-In Successful\nName: ${user.name}\nTime: ${timeStr}\nDate: ${dateStr}`;
        } else if (isCheckOut) {
          message = `🚪 Check-Out Successful\nName: ${user.name}\nTime: ${timeStr}\nDate: ${dateStr}`;
        } else {
          message = `📋 Attendance Updated\nName: ${user.name}\nTime: ${timeStr}\nDate: ${dateStr}`;
        }

        const botToken = settings?.telegramBotToken;
        if (botToken) {
          const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: user.chatId,
              text: message,
            }),
          }).catch((err) => {
            console.error("Telegram notification failed:", err);
          });
        }
      } catch (telegramError) {
        console.error("Failed to send Telegram notification:", telegramError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      attendance,
      type: isCheckIn ? "checkIn" : isCheckOut ? "checkOut" : "update",
    });
  } catch (error) {
    console.error("Attendance scan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
