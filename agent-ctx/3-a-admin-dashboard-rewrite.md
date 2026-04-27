# Task 3-a: Admin Dashboard Rewrite

## Summary
Complete UI overhaul of `/src/components/dashboards/admin-dashboard.tsx` with new color theme, password fixes, and enhanced reports.

## Key Changes

### Password Fix
- Removed `passwordMap` state from StudentsTab and TeachersTab
- Added `plainPassword?: string | null` to `StudentOrTeacher` interface
- Password display now uses `user.plainPassword || "Not available"` directly from API response
- Show/hide toggle retained with `visiblePasswords` state only
- Works correctly on both mobile and desktop

### Color Theme
- Primary: `#2F2FE4`
- Secondary: `#162E93`
- Accent: `#1A1953`
- Background/Dark: `#080616`
- Header uses gradient (accent → secondary)
- Cards use `ThemedCard` wrapper with `bg-white/5 border-white/10 text-white backdrop-blur-sm`

### Status Badges (rounded-full)
- PRESENT: green, ABSENT: red, LEAVE: amber, HOLIDAY: purple
- PENDING: yellow, APPROVED: green, REJECTED: red, NO_CLASS: gray

### Reports Tab Enhancement
- Added role filter (All/Student/Teacher) to both daily and monthly
- Daily Report: QR Logs section, separate Student/Teacher report tabs
- Daily Report: Subject-wise attendance with compact colored badges
- Monthly Report: Separate Student/Teacher sections, per-user QR Logs
- Monthly Report: Subject summary with noClass count, colored daily grid
- Summary cards with icons (UserCheck, UserX, Coffee, Sparkles)

### UI Improvements
- All buttons min-h-[44px] for touch targets
- Rounded-xl buttons with shadows
- Gradient headers, dark backgrounds, white text
- Mobile-first responsive design
- ID card with themed dark canvas

## Verification
- Lint: 0 errors, 0 warnings
- Dev server: running successfully
