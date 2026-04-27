# Task 2-b: Enhance Daily and Monthly Report APIs

## Agent: Report API Enhancement Agent

## Summary
Enhanced both daily and monthly report API endpoints with role filtering, separated student/teacher reports, QR logs, subject-wise attendance with NO_CLASS support, and future date handling.

## Changes Made

### `/src/app/api/reports/daily/route.ts`
- Added `role` query parameter (STUDENT/TEACHER) with validation
- Response now has `studentReport` and `teacherReport` arrays (instead of flat `report`)
- Added `qrLogs` array: all attendance records for the date with checkIn/checkOut, resolved names from all users
- Role filtering: no role + no class → both reports; role=STUDENT or class → studentReport only; role=TEACHER → teacherReport only
- Subject-wise attendance per entry (students from CLASS_SUBJECTS, teachers from subjects JSON)
- Status priority: HOLIDAY > LEAVE > PRESENT > ABSENT (applied to both overall and subject statuses)
- Summary derived from filtered report entries
- Holiday/leave overrides applied to subject statuses

### `/src/app/api/reports/monthly/route.ts`
- Added `role` query parameter consistent with daily report
- Separated `studentReport` and `teacherReport` arrays
- `subjectSummary` now includes `noClass` count for NO_CLASS status
- Per-user `qrLogs` array with date + formatted check-in/check-out times
- Per-user `dailyStatus` object keyed by YYYY-MM-DD
- Skips future dates (only processes up to today via `getCurrentDateString`)
- `totalDays` reflects actual processed days, excluding future
- Teacher subjects from JSON subjects field
- Holiday/leave overrides on daily and subject-level statuses

## Testing
- Both APIs tested with various query param combinations (no filter, role=STUDENT, role=TEACHER, class filter)
- QR logs correctly resolve names for all users regardless of role filter
- Lint passes cleanly
