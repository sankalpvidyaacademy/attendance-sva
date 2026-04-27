/**
 * Daily Report Cron Service for Sankalp Attendance Management
 * 
 * This service runs a cron job that sends daily attendance reports via Telegram at 9 PM.
 * It queries the main app's API for attendance data and formats/sends the report.
 */

const MAIN_APP_URL = process.env.MAIN_APP_URL || "http://localhost:3000";
const PORT = 3031;

// Store timer reference
let cronTimer: ReturnType<typeof setInterval> | null = null;

interface Settings {
  timezone: string;
  timeFormat: string;
  telegramBotToken: string | null;
  dailyReportEnabled: boolean;
  dailyReportTime: string;
}

interface DailyReportUser {
  userId: string;
  name: string;
  role: string;
  class?: string | null;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  subjects: { subject: string; status: string }[];
}

interface User {
  userId: string;
  name: string;
  role: string;
  chatId?: string | null;
  class?: string | null;
}

async function getSettings(): Promise<Settings | null> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/settings`);
    const data = await res.json();
    return data.settings || null;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return null;
  }
}

async function getDailyReport(date: string): Promise<DailyReportUser[]> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/reports/daily?date=${date}`);
    const data = await res.json();
    return data.report || [];
  } catch (error) {
    console.error("Failed to fetch daily report:", error);
    return [];
  }
}

async function getAllUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/users`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/telegram/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    });
    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

function formatTime(dateStr: string | null | undefined, timeFormat: string = "12h"): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat === "12h",
    });
  } catch {
    return "N/A";
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildReportMessage(user: DailyReportUser, date: string, timeFormat: string): string {
  const lines: string[] = [];
  
  lines.push("📊 Daily Attendance Report");
  lines.push("");
  lines.push(`Name: ${user.name}`);
  lines.push(`Date: ${formatDate(date)}`);
  lines.push("");
  lines.push(`🕒 Check-In: ${formatTime(user.checkIn, timeFormat)}`);
  lines.push(`🕒 Check-Out: ${formatTime(user.checkOut, timeFormat)}`);
  
  if (user.subjects && user.subjects.length > 0) {
    lines.push("");
    lines.push("📚 Classes:");
    for (const sub of user.subjects) {
      const statusIcon = sub.status === "PRESENT" ? "✅" : sub.status === "ABSENT" ? "❌" : sub.status === "LEAVE" ? "📋" : "🎉";
      lines.push(`${statusIcon} ${sub.subject} - ${sub.status}`);
    }
  }
  
  lines.push("");
  lines.push(`Status: ${user.status}`);
  
  return lines.join("\n");
}

async function sendDailyReports() {
  console.log(`[${new Date().toISOString()}] Running daily report cron...`);
  
  const settings = await getSettings();
  if (!settings || !settings.dailyReportEnabled) {
    console.log("Daily reports are disabled. Skipping.");
    return;
  }
  
  if (!settings.telegramBotToken) {
    console.log("Telegram bot token not configured. Skipping.");
    return;
  }
  
  // Get current date
  const today = new Date().toISOString().split("T")[0];
  
  // Get daily report
  const report = await getDailyReport(today);
  if (report.length === 0) {
    console.log("No attendance data for today. Skipping.");
    return;
  }
  
  // Get all users with chatIds
  const users = await getAllUsers();
  const usersWithChatId = users.filter((u) => u.chatId);
  
  if (usersWithChatId.length === 0) {
    console.log("No users with Telegram chat IDs. Skipping.");
    return;
  }
  
  // Send individual reports to each user with a chatId
  for (const user of usersWithChatId) {
    const userReport = report.find((r) => r.userId === user.userId);
    if (userReport) {
      const message = buildReportMessage(userReport, today, settings.timeFormat);
      const success = await sendTelegramMessage(user.chatId!, message);
      console.log(`Report sent to ${user.name} (${user.userId}): ${success ? "✅" : "❌"}`);
      
      // Rate limiting: wait 1 second between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[${new Date().toISOString()}] Daily reports sent.`);
}

function startCron() {
  const settings = getSettings();
  
  // Check every minute if it's time to send the report
  cronTimer = setInterval(async () => {
    const now = new Date();
    const settings = await getSettings();
    
    if (!settings || !settings.dailyReportEnabled) return;
    
    const [reportHour, reportMinute] = settings.dailyReportTime.split(":").map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if it's the right time (within the same minute)
    if (currentHour === reportHour && currentMinute === reportMinute) {
      // Add a random delay of 0-30 seconds to avoid running multiple times
      const delay = Math.floor(Math.random() * 30000);
      setTimeout(() => sendDailyReports(), delay);
    }
  }, 60000); // Check every minute
  
  console.log(`Daily report cron started. Checking every minute for scheduled time.`);
}

// Health check endpoint using Bun's built-in server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/api/ping") {
      return Response.json({ status: "ok", service: "daily-report", timestamp: new Date().toISOString() });
    }
    
    if (url.pathname === "/api/trigger-report" && req.method === "POST") {
      await sendDailyReports();
      return Response.json({ status: "ok", message: "Daily reports triggered manually" });
    }
    
    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Daily Report Service running on port ${PORT}`);
startCron();
