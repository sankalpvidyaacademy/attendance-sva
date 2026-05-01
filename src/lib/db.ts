// Database adapter - Firebase Firestore
// This file exports the same `db` interface that API routes use.
// Swap between Prisma (SQLite) and Firebase by changing this file only.

import { db as firebaseDb } from "./firebase-service";

export const db = firebaseDb;
