import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ATTENDANCE_STATUS,
  getCurrentDateString,
  formatTime,
  formatDate,
} from "@/lib/constants";

// Minimum delay between scans in milliseconds (10 seconds)
const MIN_SCAN_DELAY_MS = 10_000;

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

    // Get current date using app timezone (not device/browser time)
    const date = dateParam || getCurrentDateString(timezone);
    const now = new Date();

    // Use timezone-aware current time for all operations
    const currentTimeStr = formatTime(now, timeFormat, timezone);
    const currentDateStr = formatDate(now, timezone);

    // ── Fetch existing record within a read to evaluate state ──
    const existingRecord = await db.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    // ── Strict scan delay enforcement (10 seconds) ──
    if (existingRecord?.lastScanAt) {
      const timeSinceLastScan =
        now.getTime() - new Date(existingRecord.lastScanAt).getTime();
      if (timeSinceLastScan < MIN_SCAN_DELAY_MS) {
        const remainingSeconds = Math.ceil(
          (MIN_SCAN_DELAY_MS - timeSinceLastScan) / 1000
        );
        return NextResponse.json(
          {
            error: `⏳ Please wait ${remainingSeconds} seconds before next scan`,
            cooldownRemaining: remainingSeconds,
            lastScanAt: existingRecord.lastScanAt,
          },
          { status: 429 }
        );
      }
    }

    // ── Strict state machine: determine exactly what this scan should do ──
    let attendance;
    let scanType: "checkIn" | "checkOut" | "alreadyCheckedIn" | "alreadyCheckedOut";
    let message: string;

    if (!existingRecord) {
      // No record exists → Check-In only
      attendance = await db.$transaction(async (tx) => {
        return tx.attendance.create({
          data: {
            userId,
            date,
            checkIn: now,
            status: ATTENDANCE_STATUS.PRESENT,
            lastScanAt: now,
          },
        });
      });
      scanType = "checkIn";
      message = `✅ Check-In Successful`;
    } else if (existingRecord.checkIn && existingRecord.checkOut) {
      // Already checked in AND checked out → fully done for the day
      scanType = "alreadyCheckedOut";
      return NextResponse.json(
        {
          error: "✓ Already Checked-Out for the day",
          attendance: existingRecord,
          type: "alreadyCheckedOut",
          userName: user.name,
          checkInTime: formatTime(new Date(existingRecord.checkIn), timeFormat, timezone),
          checkOutTime: formatTime(new Date(existingRecord.checkOut), timeFormat, timezone),
        },
        { status: 400 }
      );
    } else if (existingRecord.checkIn && !existingRecord.checkOut) {
      // Has checkIn but no checkOut → Check-Out only
      attendance = await db.$transaction(async (tx) => {
        return tx.attendance.update({
          where: { id: existingRecord.id },
          data: {
            checkOut: now,
            lastScanAt: now,
          },
        });
      });
      scanType = "checkOut";
      message = `🚪 Check-Out Successful`;
    } else {
      // Edge case: record exists with no checkIn (e.g., created as ABSENT by system)
      // → Check-In
      attendance = await db.$transaction(async (tx) => {
        return tx.attendance.update({
          where: { id: existingRecord.id },
          data: {
            checkIn: now,
            status: ATTENDANCE_STATUS.PRESENT,
            lastScanAt: now,
          },
        });
      });
      scanType = "checkIn";
      message = `✅ Check-In Successful`;
    }

    // ── Send Telegram notification if user has chatId (fire-and-forget) ──
    if (user.chatId) {
      try {
        let telegramMessage: string;
        if (scanType === "checkIn") {
          telegramMessage = `✅ Check-In Successful\nName: ${user.name}\nTime: ${currentTimeStr}\nDate: ${currentDateStr}`;
        } else if (scanType === "checkOut") {
          telegramMessage = `🚪 Check-Out Successful\nName: ${user.name}\nTime: ${currentTimeStr}\nDate: ${currentDateStr}`;
        } else {
          telegramMessage = `📋 Attendance Updated\nName: ${user.name}\nTime: ${currentTimeStr}\nDate: ${currentDateStr}`;
        }

        const botToken = settings?.telegramBotToken;
        if (botToken) {
          const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
          fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: user.chatId,
              text: telegramMessage,
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

    // ── Return comprehensive response ──
    return NextResponse.json({
      success: true,
      message,
      type: scanType,
      userName: user.name,
      userId: user.userId,
      time: currentTimeStr,
      date: currentDateStr,
      attendance: {
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
        lastScanAt: attendance.lastScanAt,
      },
      cooldownSeconds: MIN_SCAN_DELAY_MS / 1000,
    });
  } catch (error) {
    console.error("Attendance scan error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
