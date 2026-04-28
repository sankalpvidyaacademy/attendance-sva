# Task 7-c: Make Admin Dashboard Content Theme-Aware for Dark/Light Mode

## Agent: Theme Awareness Agent

## Work Summary
Made the admin dashboard content areas theme-aware for both light and dark modes by replacing hardcoded dark-mode-only CSS classes with dual-mode variants.

## Changes Made

### Subject Badge Styling (lines 1220, 1715)
- `bg-[#2F2FE4]/20 text-[#2F2FE4] border-[#2F2FE4]/30` → `bg-[#2F2FE4]/10 text-[#2F2FE4] border-[#2F2FE4]/20 dark:bg-[#2F2FE4]/20 dark:border-[#2F2FE4]/30`
- Applied to both StudentsTab and TeachersTab subject badges

### Destructive Button Styling (lines 1265, 1774, 2656, 3054)
- `border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300` → `border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-300`
- Applied to: Delete Student, Delete Teacher, Remove Card, Delete Holiday buttons

### Amber/Mark-Off Button Styling (line 1752)
- `border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300` → `border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-500 dark:hover:text-amber-300`

### Holiday Class Badge Styling (line 3044)
- `bg-purple-500/20 text-purple-400 border-purple-500/30` → `bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30`

### QR Scanner Status Icons (lines 2165, 2167)
- `text-green-400` → `text-green-600 dark:text-green-400` (CheckCircle)
- `text-orange-400` → `text-orange-600 dark:text-orange-400` (XCircle)

### Daily Report Summary Cards (lines 3428-3482)
- `bg-white/10` (decorative bg) → `bg-muted dark:bg-white/10`
- `bg-green-500/20` icon bg → `bg-green-100 dark:bg-green-500/20`
- `text-green-400` icon/text → `text-green-600 dark:text-green-400`
- Same pattern for red, amber, purple cards

### Monthly Report Summary Badges (lines 3768-3798, 3820-3833)
- `bg-green-500/20 text-green-400` → `bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400`
- `bg-red-500/20 text-red-400` → `bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400`
- `bg-amber-500/20 text-amber-400` → `bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400`
- `bg-purple-500/20 text-purple-400` → `bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400`
- `bg-gray-500/20 text-gray-400` → `bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400`

### Subject Status Color Conditionals (lines 3595-3599, 3656-3658)
- `text-green-400` → `text-green-600 dark:text-green-400` (and same for red, amber, purple, gray)

### Container Backgrounds
- `bg-white/5 border border-white/5` (line 3816) → `bg-muted dark:bg-white/5 border border-border dark:border-white/5`
- `bg-white/5` QR log row (line 3853) → `bg-muted dark:bg-white/5`

### Separator Styling (lines 3804, 4162, 4179, 4209)
- `bg-white/10` → `bg-border dark:bg-white/10`

### Items NOT Changed (per task requirements)
- Sidebar and header (already theme-aware from Task 6-a)
- PDF generation functions (lines ~562-1033)
- ID card canvas drawing code
- DialogContent components (bg-white is correct)
- THEME, STUDENT_CARD, TEACHER_CARD constants
- Inline style props using THEME colors (canvas/ID card)
- Primary buttons (bg-[#2F2FE4] text-white is correct for both modes)
- Active tab text (data-[state=active]:text-white on blue bg is correct)
- Text classes already having both light and dark variants

## Verification
- `bun run lint` passes with 0 errors
- Dev server compiles successfully
