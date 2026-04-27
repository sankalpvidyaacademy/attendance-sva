import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let settings = await db.settings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await db.settings.create({
        data: {},
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      timezone,
      timeFormat,
      telegramBotToken,
      dailyReportEnabled,
      dailyReportTime,
    } = body;

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (timezone !== undefined) updateData.timezone = timezone;
    if (timeFormat !== undefined) updateData.timeFormat = timeFormat;
    if (telegramBotToken !== undefined) updateData.telegramBotToken = telegramBotToken;
    if (dailyReportEnabled !== undefined) updateData.dailyReportEnabled = dailyReportEnabled;
    if (dailyReportTime !== undefined) updateData.dailyReportTime = dailyReportTime;

    // Get existing settings or create
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: updateData,
      });
    } else {
      settings = await db.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
