import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        name: true,
        userId: true,
        plainPassword: true,
        class: true,
        subjects: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate QR code data URL from userId (for scanning)
    const qrCodeDataUrl = await QRCode.toDataURL(user.userId, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Parse subjects from JSON if present
    let parsedSubjects: string[] = [];
    if (user.subjects) {
      try {
        parsedSubjects = JSON.parse(user.subjects);
      } catch {
        parsedSubjects = [];
      }
    }

    return NextResponse.json({
      user: {
        name: user.name,
        userId: user.userId,
        password: user.plainPassword,
        class: user.class,
        subjects: parsedSubjects,
        role: user.role,
      },
      qrCodeDataUrl,
    });
  } catch (error) {
    console.error("Generate ID card error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
