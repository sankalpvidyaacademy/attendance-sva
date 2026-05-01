// Class & Subject Structure for Sankalp Attendance Management

// 13 individual classes per specification
export const CLASSES = [
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9 CBSE",
  "Class 10 CBSE",
  "Class 9 ICSE",
  "Class 10 ICSE",
  "Class 11 Science",
  "Class 12 Science",
  "Class 11 Commerce",
  "Class 12 Commerce",
] as const;

// Class → Subjects mapping (each class has its own independent subject list)
export const CLASS_SUBJECTS: Record<string, string[]> = {
  // Classes 4–8: Same subjects
  "Class 4": ["A-4-8 Subject", "H-4-8 Subject", "R-4-8 Subject", "S-4-8 Subject"],
  "Class 5": ["A-4-8 Subject", "H-4-8 Subject", "R-4-8 Subject", "S-4-8 Subject"],
  "Class 6": ["A-4-8 Subject", "H-4-8 Subject", "R-4-8 Subject", "S-4-8 Subject"],
  "Class 7": ["A-4-8 Subject", "H-4-8 Subject", "R-4-8 Subject", "S-4-8 Subject"],
  "Class 8": ["A-4-8 Subject", "H-4-8 Subject", "R-4-8 Subject", "S-4-8 Subject"],
  // Classes 9–10 (CBSE & ICSE)
  "Class 9 CBSE": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "SST"],
  "Class 10 CBSE": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "SST"],
  "Class 9 ICSE": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "SST"],
  "Class 10 ICSE": ["Mathematics", "Physics", "Chemistry", "Biology", "English", "SST"],
  // Classes 11–12 Science
  "Class 11 Science": ["Mathematics", "Physics", "Chemistry", "Biology"],
  "Class 12 Science": ["Mathematics", "Physics", "Chemistry", "Biology"],
  // Classes 11–12 Commerce
  "Class 11 Commerce": ["Accounts", "Business Studies", "Economics", "English", "Applied Mathematics"],
  "Class 12 Commerce": ["Accounts", "Business Studies", "Economics", "English", "Applied Mathematics"],
};

// Legacy class name mapping for backward compatibility with old DB records
export const LEGACY_CLASS_MAP: Record<string, string> = {
  "Class 4-8": "Class 4", // Map old grouped class to first class in group
  "Class 11-12 Science": "Class 11 Science",
  "Class 11-12 Commerce": "Class 11 Commerce",
};

// Resolve a class name: if it's a legacy name, try to resolve; otherwise return as-is
export function resolveClassName(className: string | null | undefined): string | null {
  if (!className) return null;
  // If it's already a valid new class name, return as-is
  if (CLASSES.includes(className as any)) return className;
  // Try legacy mapping
  if (LEGACY_CLASS_MAP[className]) return LEGACY_CLASS_MAP[className];
  // Return as-is if no mapping found (might be a valid custom class)
  return className;
}

// Parse teacher subjects from DB JSON
// Supports both:
//   - NEW format: Record<string, string[]> e.g. {"Class 9 CBSE": ["Mathematics", "Physics"]}
//   - OLD format: string[] e.g. ["Mathematics", "Physics"] (backward compatibility)
export function parseTeacherSubjects(subjectsJson: string | null | undefined): Record<string, string[]> {
  if (!subjectsJson) return {};
  try {
    const parsed = JSON.parse(subjectsJson);
    if (Array.isArray(parsed)) {
      // OLD format: flat array of subjects
      // Derive which classes they belong to based on CLASS_SUBJECTS
      const result: Record<string, string[]> = {};
      for (const cls of CLASSES) {
        const classSubjects = CLASS_SUBJECTS[cls] || [];
        const matchedSubjects = parsed.filter((s: string) => classSubjects.includes(s));
        if (matchedSubjects.length > 0) {
          result[cls] = matchedSubjects;
        }
      }
      return result;
    }
    if (typeof parsed === "object" && parsed !== null) {
      // NEW format: class-subjects mapping
      return parsed as Record<string, string[]>;
    }
    return {};
  } catch {
    return {};
  }
}

// Get all unique subjects from a teacher's class-subjects map
export function getAllSubjectsFromClassMap(classSubjects: Record<string, string[]>): string[] {
  const subjectSet = new Set<string>();
  Object.values(classSubjects).forEach((subs) => {
    subs.forEach((s) => subjectSet.add(s));
  });
  return Array.from(subjectSet).sort();
}

// Get all classes a teacher teaches
export function getTeacherClasses(classSubjects: Record<string, string[]>): string[] {
  return Object.keys(classSubjects).filter((cls) => {
    const subs = classSubjects[cls];
    return Array.isArray(subs) && subs.length > 0;
  });
}

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
