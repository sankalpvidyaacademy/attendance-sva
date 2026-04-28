# Tasks 2 & 4: PDF Report Redesign + ID Card Delete Option

## Task 2: PDF Report Redesign - COMPLETED

### Changes Made
- Completely rewrote all PDF generation helper functions and report functions in `admin-dashboard.tsx`
- Enhanced `PDF_COLORS` with status background colors (presentBg, absentBg, leaveBg, holidayBg, noClassBg)
- Added `getStatusBgColor()` helper for status pill backgrounds
- Replaced `truncateText()` with auto text wrapping using `doc.splitTextToSize()`
- Rewrote `drawTableHeader()`: 10mm row height, 3mm padding, dark header background, 9pt bold white text
- Rewrote `drawTableRow()`: Auto text wrapping, dynamic row height (min 10mm), page break handling, 3mm cell padding, vertical text centering, colored status pills with `roundedRect`
- Added `drawSectionDivider()`: Visual separator with accent line and bold title
- Added `drawPDFHeader()`: Shared 38mm header bar with org name, report title, date
- Rewrote `generateDailyReportPDF()`: Uses shared header/footer, compact filter line, section dividers
- Rewrote `generateMonthlyReportPDF()`: Same improvements, user info bars with `roundedRect`

### Key Technical Improvements
- Auto text wrapping via `doc.splitTextToSize()` instead of truncation
- Dynamic row height calculation based on content
- Status column draws colored pills with background and foreground colors
- Proper page break handling with footer drawn before new page
- 3mm cell padding with vertical text centering

## Task 4: ID Card Delete Option - COMPLETED

### Changes Made
- Added `AlertTriangle` and `RefreshCw` icons to imports
- Added `showDeleteConfirm` and `regenerating` state variables to IDCardsTab
- Added `handleDeleteCard()`: Closes confirmation, clears selectedCard, shows toast
- Added `handleRegenerateCard()`: Re-fetches card data from API, updates preview, shows toast
- Updated dialog footer with: Delete Card (destructive), Close, Regenerate, Download JPG
- Added Delete Confirmation Dialog with AlertTriangle icon, clear description, Cancel/Delete buttons
- Responsive layout: stacked on mobile (flex-col), inline on desktop (flex-row)
- All buttons have `w-full sm:w-auto` for mobile-friendly sizing

### Preserved
- Existing `handleRemoveCard()` (X button on user list) - still works
- Existing `handleDownload()` - unchanged
- Existing `handleGenerateCard()` - unchanged
- No database schema changes, no API changes
