import { NextResponse } from "next/server";
import { seedAdmin, seedSettings } from "@/lib/seed";

export async function POST() {
  try {
    await seedAdmin();
    await seedSettings();
    return NextResponse.json({ message: "Database seeded successfully" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
