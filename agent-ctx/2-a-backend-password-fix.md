# Task 2-a: Fix password handling in backend APIs

## Summary
Updated all 5 backend files to properly store and return `plainPassword` alongside the hashed `password` field.

## Changes Made

### 1. `/src/app/api/users/route.ts`
- **GET**: Added `plainPassword: true` to the Prisma select clause so it's included in the response
- **POST**: Added `plainPassword` to `db.user.create` data (stores the generated plain text password)

### 2. `/src/app/api/users/[id]/route.ts`
- **GET**: Added `plainPassword: user.plainPassword` to the response
- **PUT**: Added `password` destructuring from request body; when password is provided, updates both `password` (hashed via `hashPassword`) and `plainPassword` (plain text)
- Added `import { hashPassword } from "@/lib/auth"`

### 3. `/src/app/api/id-card/[id]/route.ts`
- Changed Prisma select from `password: true` to `plainPassword: true`
- Response now explicitly maps `user.plainPassword` to the `password` field: `password: user.plainPassword`
- Response structure preserved: `{ user: { name, userId, password, class, subjects, role }, qrCodeDataUrl }`

### 4. `/src/app/api/auth/change-password/route.ts`
- Added `plainPassword: newPassword` to the `db.user.update` data alongside `password: hashedNewPassword`

### 5. `/src/lib/seed.ts`
- Added `plainPassword: "Shobhit@1502"` to the admin user creation data

### Database Backfill
- Ran `UPDATE User SET plainPassword = 'Shobhit@1502' WHERE userId = 'shobhit' AND plainPassword IS NULL` to backfill existing admin

## Verification
- `bun run lint` passes with no errors
- Dev server running without issues
