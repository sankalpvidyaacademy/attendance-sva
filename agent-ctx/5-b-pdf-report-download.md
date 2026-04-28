# Task 5-b: PDF Report Download Feature

## Summary
Added PDF download functionality to both Daily and Monthly report tabs in the AdminDashboard.

## Changes Made

### File: `/home/z/my-project/src/components/dashboards/admin-dashboard.tsx`

1. **Import**: Added `import jsPDF from "jspdf"` at line 77

2. **PDF Helper Functions** (lines 478-915):
   - `PDF_COLORS` constant - Color scheme for PDF generation
   - `getStatusColor()` - Maps attendance status to color
   - `drawTableHeader()` - Draws formatted table header row
   - `drawTableRow()` - Draws data row with alternating colors and status highlighting
   - `checkPageSpace()` - Auto-pagination helper
   - `generateDailyReportPDF()` - Full daily report PDF with header, filters, summary, QR logs, student/teacher tables, footer
   - `generateMonthlyReportPDF()` - Full monthly report PDF with per-user sections, subject summaries, footer

3. **DailyReport Component** (line ~3172):
   - Added `pdfLoading` state
   - Added `downloadPDF` handler
   - Added "PDF" button next to "Generate" button

4. **MonthlyReport Component** (line ~3579):
   - Added `pdfLoading` state
   - Added `downloadPDF` handler
   - Added "PDF" button next to "Generate" button

## Testing
- Lint check passes with 0 errors
- Dev server compiles successfully
- No changes to existing report display logic, ID Cards tab, or API routes
