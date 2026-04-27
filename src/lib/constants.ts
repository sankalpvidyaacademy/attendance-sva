// Class & Subject Structure for Sankalp Attendance Management

export const CLASSES = [
  "Class 4-8",
  "Class 9 CBSE",
  "Class 9 ICSE",
  "Class 10 CBSE",
  "Class 10 ICSE",
  "Class 11-12 Science",
  "Class 11-12 Commerce",
] as const;

export const CLASS_SUBJECTS: Record<string, string[]> = {
  "Class 4-8": ["A-4-8 Subjects", "H-4-8 Subjects", "R-4-8 Subjects", "S-4-8 Subjects"],
  "Class 9 CBSE": ["Mathematics", "Physics", "Chemistry", "Biology", "SST", "English"],
  "Class 9 ICSE": ["Mathematics", "Physics", "Chemistry", "Biology", "SST", "English"],
  "Class 10 CBSE": ["Mathematics", "Physics", "Chemistry", "Biology", "SST", "English"],
  "Class 10 ICSE": ["Mathematics", "Physics", "Chemistry", "Biology", "SST", "English"],
  "Class 11-12 Science": ["Mathematics", "Physics", "Chemistry", "Biology"],
  "Class 11-12 Commerce": ["Accounts", "Business Studies", "Economics", "English", "Applied Mathematics"],
};

export const ROLES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
  HOLIDAY: "HOLIDAY",
} as const;

export const SUBJECT_ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LEAVE: "LEAVE",
  HOLIDAY: "HOLIDAY",
  NO_CLASS: "NO_CLASS",
} as const;

export const LEAVE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

// Priority: Holiday > Leave > Attendance > Absent
export const STATUS_PRIORITY: Record<string, number> = {
  HOLIDAY: 4,
  LEAVE: 3,
  PRESENT: 2,
  ABSENT: 1,
};

// Generate a random user ID from name
export function generateUserId(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${random}`;
}

// Generate a random 8-character password (A-Z, a-z, 0-9)
export function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  // Ensure at least one of each type
  password += chars[Math.floor(Math.random() * 26)]; // A-Z
  password += chars[Math.floor(Math.random() * 26) + 26]; // a-z
  password += chars[Math.floor(Math.random() * 10) + 52]; // 0-9
  for (let i = 3; i < 8; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Format time based on settings
export function formatTime(date: Date, timeFormat: string = "12h", timezone: string = "Asia/Kolkata"): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat === "12h",
      timeZone: timezone,
    };
    return date.toLocaleTimeString("en-IN", options);
  } catch {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: timeFormat === "12h",
    });
  }
}

// Format date
export function formatDate(date: Date, timezone: string = "Asia/Kolkata"): string {
  try {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    });
  } catch {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
}

// Get current date string in YYYY-MM-DD format using timezone
export function getCurrentDateString(timezone: string = "Asia/Kolkata"): string {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    });
    return formatter.format(now);
  } catch {
    return now.toISOString().split("T")[0];
  }
}
