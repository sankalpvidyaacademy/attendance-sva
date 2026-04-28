# Task 6-a: Add Sidebar Navigation to AdminDashboard + Fix Contrast Issues

## Agent: Sidebar Navigation Agent

## Summary
Replaced horizontal tab navigation with sidebar navigation in AdminDashboard, fixed dialog contrast issues.

## Changes Made

### File Modified
`/home/z/my-project/src/components/dashboards/admin-dashboard.tsx`

### 1. Import Changes
- Added `LayoutDashboard` and `Menu` to lucide-react imports

### 2. Sidebar Navigation (replacing horizontal tabs)
- Added `NAV_ITEMS` constant with 9 navigation items:
  - Dashboard (LayoutDashboard) → students tab
  - Attendance (ScanLine) → scanner tab
  - Reports (FileBarChart) → reports tab
  - Students (Users) → students tab
  - Teachers (GraduationCap) → teachers tab
  - Leave (Clock) → leave tab
  - Holidays (CalendarDays) → holidays tab
  - ID Cards (IdCard) → idcards tab
  - Settings (Settings) → settings tab
- Added `NavKey` type for type-safe navigation
- Added `getActiveLabel()` helper function
- Desktop sidebar: Fixed left, 240px wide, THEME.accent background
- Mobile sidebar: Hamburger menu + slide-out drawer with bg-black/50 overlay
- Active item: THEME.primary background (#2F2FE4), white text
- Inactive items: text-white/70, hover:bg-white/10
- Sidebar bottom: User info + Logout button
- Sidebar top: Logo area with "Sankalp Attendance" title and "Admin Panel" subtitle

### 3. Header Changes
- Simplified to: hamburger menu (mobile only), dynamic page title, user info, logout
- Header shows current page name based on activeNav

### 4. Content Area Changes
- Main area uses `ml-0 lg:ml-60` for sidebar offset on desktop
- Replaced Tabs/TabsContent with conditional rendering
- Uses `activeNav` state (NavKey type) → derives `activeTab` from NAV_ITEMS mapping

### 5. Contrast Fixes
- Added `bg-white` class to all DialogContent components:
  - StudentFormDialog
  - TeacherFormDialog
  - AddHolidayDialog
  - Delete Student dialog
  - Delete Teacher dialog
  - Delete Holiday dialog
  - Student Created Credentials dialog
  - Teacher Created Credentials dialog
  - ID Card Preview dialog
- Verified Select/Calendar/Popover portal components work correctly in light mode

### No Changes To
- Backend logic or API routes
- Attendance system
- Data flow or state management
- Tab content components (StudentsTab, TeachersTab, etc.)
