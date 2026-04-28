# Task 5-a: Enhance ID Card Design in AdminDashboard

## Agent: ID Card Design Enhancement Agent

## Summary
Enhanced the IDCardsTab component in admin-dashboard.tsx with role-based color themes, professional card layout, organization name update, soft delete functionality, and updated canvas download.

## Changes Made

### 1. Role-Specific Color Constants
- Added `STUDENT_CARD` constant: primary #2F2FE4, secondary #162E93, accent #1A1953, headerGradient [#1A1953, #2F2FE4]
- Added `TEACHER_CARD` constant: primary #DC2626, secondary #991B1B, accent #7F1D1D, headerGradient [#7F1D1D, #DC2626]

### 2. Imports
- Added Tooltip, TooltipTrigger, TooltipContent from @/components/ui/tooltip
- Removed unused BadgeCheck import

### 3. IDCardsTab Component Enhancements

#### Role Identification
- Students show "Student ID Card" label in header
- Teachers show "Teacher ID Card" label in header

#### Color Themes
- Students: Blue theme (STUDENT_CARD colors)
- Teachers: Red theme (TEACHER_CARD colors)
- Header gradient, borders, accent elements reflect role color

#### Organization Name
- Changed "Sankalp" to "Sankalp Vidya Academy" in:
  - ID card preview header
  - Canvas download header text
  - Footer text (both preview and canvas)
- Kept "Sankalp Attendance" in app header unchanged

#### Modern Card Preview Design
- Gradient header with org name + role badge
- Name displayed large and bold (text-xl)
- Class shown as pill/badge (students only)
- Subjects as small pills/badges instead of comma-separated
- User ID & Password in separate info section with grid layout
- QR Code centered with glow/border effect
- Footer with scan instruction + org name
- Role-based color border, rounded corners, shadow

#### Soft Delete (Remove Card)
- "X" button appears next to ID Card button when card is being previewed
- Tooltip shows "Remove Card" on hover
- Clicking closes the dialog and shows toast "Card removed from view"
- Does NOT delete any user data

#### Canvas Download
- Uses role-based colors throughout
- Draws header gradient, org name, role badge pill
- Name drawn bold 20px
- Class as pill badge
- Subjects as separate pill items
- User ID & Password in labeled info section
- QR Code with glow/border effect
- Footer with "Sankalp Vidya Academy"
- Role-based border around card

## Lint Status
- All lint checks pass (0 errors, 0 warnings)
- Dev server compiling successfully
