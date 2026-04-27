import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

/**
 * Seed the database with the fixed admin account
 */
export async function seedAdmin() {
  const existingAdmin = await db.user.findFirst({
    where: { role: ROLES.ADMIN },
  });

  if (!existingAdmin) {
    const hashedPassword = await hashPassword("Shobhit@1502");
    await db.user.create({
      data: {
        userId: "shobhit",
        name: "Shobhit",
        role: ROLES.ADMIN,
        password: hashedPassword,
      },
    });
    console.log("Admin account created: shobhit / Shobhit@1502");
  } else {
    console.log("Admin account already exists");
  }
}

/**
 * Seed default settings
 */
export async function seedSettings() {
  const existing = await db.settings.findFirst();
  if (!existing) {
    await db.settings.create({
      data: {
        timezone: "Asia/Kolkata",
        timeFormat: "12h",
        telegramBotToken: "",
        dailyReportEnabled: false,
        dailyReportTime: "21:00",
      },
    });
    console.log("Default settings created");
  } else {
    console.log("Settings already exist");
  }
}

export async function seedDatabase() {
  await seedAdmin();
  await seedSettings();
}
