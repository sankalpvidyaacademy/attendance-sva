# Task 6-b: Sidebar Navigation + Contrast Fix Agent

## Task
Add Sidebar Navigation to Teacher & Student Dashboards + Fix Contrast Issues

## Work Completed

### Teacher Dashboard (`teacher-dashboard.tsx`)
- Replaced horizontal Tabs with fixed sidebar navigation
- Added `activeTab` state (TeacherTab: "attendance" | "mark" | "leave" | "holidays")
- Added `sidebarOpen` state for mobile drawer
- Removed Tabs/TabsContent/TabsList/TabsTrigger imports
- Created SIDEBAR_ITEMS array with icons: Attendance→ClipboardCheck, Mark→CalendarDays, Leave→Plane, Holidays→PartyPopper
- Desktop sidebar: w-60 (240px), fixed, THEME.accent background
- Mobile sidebar: hamburger menu + slide-out drawer + bg-black/50 overlay
- Active item: THEME.primary background, white text, rounded-lg
- Inactive items: text-white/70, hover:bg-white/10
- Sidebar bottom: user info + logout
- Header: hamburger (mobile) + dynamic title + user welcome + logout
- Fixed contrast: Leave dialog labels now use text-gray-900

### Student Dashboard (`student-dashboard.tsx`)
- Same sidebar pattern as teacher
- Student sidebar items: Attendance→ClipboardCheck, Leave→Plane, Holidays→PartyPopper
- Sidebar subtitle: "Student Panel"
- User info includes class badge
- Fixed contrast: Leave dialog labels use text-gray-900
- Subject date picker: white/ghost styled
- Monthly input: dark-themed

### Verification
- `bun run lint` passes with 0 errors
- Dev server compiles successfully
- All existing tab content and data flow preserved
- No changes to backend/API routes
