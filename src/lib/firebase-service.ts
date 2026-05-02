import { firestore } from "./firebase-admin";
import {
  Timestamp,
} from "firebase-admin/firestore";

// ─── Firestore collection names ─────────────────────────────────────────────
const COLLECTIONS = {
  users: "users",
  attendance: "attendance",
  subjectAttendance: "subjectAttendance",
  leaveRequests: "leaveRequests",
  holidays: "holidays",
  settings: "settings",
} as const;

// ─── Helper: convert Firestore doc to plain object ──────────────────────────
function docToObj<T = Record<string, unknown>>(snap: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  return {
    id: snap.id,
    ...serializeTimestamps(data),
  } as T;
}

function serializeTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Timestamp) {
      // Convert Firestore Timestamps to JavaScript Date objects
      // This matches Prisma's behavior so API routes can call .toISOString() etc.
      result[key] = value.toDate();
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = serializeTimestamps(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ─── Helper: apply select to filter fields from a result ────────────────────
function applySelect(
  item: Record<string, unknown>,
  select: Record<string, boolean>
): Record<string, unknown> {
  const selected: Record<string, unknown> = { id: item.id };
  for (const key of Object.keys(select)) {
    if (select[key]) {
      selected[key] = item[key];
    }
  }
  return selected;
}

// ─── Helper: normalize orderBy to array of [field, direction] pairs ─────────
// Supports both: { field: "asc" } and [{ field: "asc" }, { field: "desc" }]
type OrderByInput = Record<string, string> | Array<Record<string, string>> | undefined;

function normalizeOrderBy(orderBy: OrderByInput): Array<[string, "asc" | "desc"]> {
  if (!orderBy) return [];
  if (Array.isArray(orderBy)) {
    return orderBy.flatMap((item) =>
      Object.entries(item).map(([field, direction]) => [field, direction as "asc" | "desc"])
    );
  }
  return Object.entries(orderBy).map(([field, direction]) => [field, direction as "asc" | "desc"]);
}

// ─── In-memory filter for complex queries Firestore can't handle ─────────────
function filterResults<T extends Record<string, unknown>>(
  results: T[],
  whereClause: Record<string, unknown>
): T[] {
  return results.filter((item) => {
    for (const [field, value] of Object.entries(whereClause)) {
      if (value === undefined || value === null) continue;

      // OR condition
      if (field === "OR" && Array.isArray(value)) {
        const orMatch = (value as Record<string, unknown>[]).some((orClause) =>
          Object.entries(orClause).every(([k, v]) => {
            if (typeof v === "object" && v !== null && "contains" in (v as object)) {
              const searchStr = String((v as { contains: string }).contains).toLowerCase();
              const itemVal = String(item[k] ?? "").toLowerCase();
              return itemVal.includes(searchStr);
            }
            return item[k] === v;
          })
        );
        if (!orMatch) return false;
        continue;
      }

      // { contains: "text" }
      if (typeof value === "object" && value !== null && "contains" in (value as object)) {
        const searchStr = String((value as { contains: string }).contains).toLowerCase();
        const itemVal = String(item[field] ?? "").toLowerCase();
        if (!itemVal.includes(searchStr)) return false;
        continue;
      }

      // { in: [...] }
      if (typeof value === "object" && value !== null && "in" in (value as object)) {
        const arr = (value as { in: unknown[] }).in;
        if (!arr.includes(item[field])) return false;
        continue;
      }

      // Range queries — always filter in-memory too for correctness
      // (Firestore may not have received all range conditions due to index limits)
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const rangeOps = value as Record<string, unknown>;
        const itemVal = item[field];
        if ("gte" in rangeOps && itemVal < rangeOps.gte) return false;
        if ("lte" in rangeOps && itemVal > rangeOps.lte) return false;
        if ("lt" in rangeOps && itemVal >= rangeOps.lt) return false;
        // Don't continue — fall through in case there are other checks
        continue;
      }

      // Simple equality
      if (item[field] !== value) return false;
    }
    return true;
  });
}

// ─── Helper: build Firestore query from Prisma-style where clause ────────────
// Strategy: Send ONLY equality + in conditions to Firestore.
// ALL range conditions (gte, lte, lt), OR, and contains are filtered in-memory.
// This completely avoids needing any Firestore composite indexes.
// For a school attendance system (small dataset), this is perfectly fine.
function buildWhereQuery(
  col: FirebaseFirestore.CollectionReference,
  whereClause: Record<string, unknown>
): FirebaseFirestore.Query {
  let q: FirebaseFirestore.Query = col;

  for (const [field, value] of Object.entries(whereClause)) {
    if (value === undefined || value === null) continue;
    if (field === "OR") continue; // handled in-memory
    if (typeof value === "object" && value !== null && "contains" in (value as object)) continue; // in-memory

    // Range queries — always filter in-memory to avoid composite index requirements
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const rangeOps = value as Record<string, unknown>;
      if ("gte" in rangeOps || "lte" in rangeOps || "lt" in rangeOps) continue; // in-memory
    }

    // { in: [...] }
    if (typeof value === "object" && value !== null && "in" in (value as object)) {
      const arr = (value as { in: unknown[] }).in;
      if (arr.length > 0) {
        q = q.where(field, "in", arr);
      } else {
        q = q.where(field, "==", "__IMPOSSIBLE__");
      }
      continue;
    }

    // Simple equality
    q = q.where(field, "==", value);
  }

  return q;
}

// ─── Composite key helpers ──────────────────────────────────────────────────
function attendanceDocId(userId: string, date: string): string {
  return `${userId}_${date}`;
}

function subjectAttendanceDocId(userId: string, date: string, subject: string): string {
  return `${userId}_${date}_${subject}`;
}

// ─── Helper: convert Date objects to Firestore Timestamps ────────────────────
function toFirestoreData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ─── Helper: fetch all users and build a map ────────────────────────────────
async function getUserMap(): Promise<Map<string, Record<string, unknown>>> {
  const usersSnap = await firestore.collection(COLLECTIONS.users).get();
  const userMap = new Map<string, Record<string, unknown>>();
  usersSnap.docs.forEach((d) => {
    const userData = serializeTimestamps(d.data()!);
    userMap.set(userData.userId as string, { ...userData, id: d.id });
  });
  return userMap;
}

function applyUserSelect(
  user: Record<string, unknown> | null,
  userSelect: { select?: Record<string, boolean> } | undefined
): Record<string, unknown> | null {
  if (!user) return null;
  if (!userSelect?.select) return user;
  return applySelect(user, userSelect.select);
}

// ─── Helper: sort results in-memory ────────────────────────────────────────
// Always sort in-memory to avoid Firestore composite index requirements.
// For a school attendance system (small dataset), this is perfectly fine.
function sortResults<T extends Record<string, unknown>>(
  results: T[],
  orderBy: OrderByInput
): T[] {
  const orderPairs = normalizeOrderBy(orderBy);
  if (orderPairs.length === 0) return results;

  return results.sort((a, b) => {
    for (const [field, direction] of orderPairs) {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) continue;
      if (aVal == null) return 1; // nulls last
      if (bVal == null) return -1; // nulls last

      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      if (cmp !== 0) {
        return direction === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

// ─── Firebase Database Adapter ──────────────────────────────────────────────
// Mimics the Prisma `db` object interface so API routes need minimal changes

export const db = {
  user: {
    async findUnique(args: { where: { id?: string; userId?: string; userId_date?: unknown }; select?: Record<string, boolean> }) {
      const col = firestore.collection(COLLECTIONS.users);

      let result: Record<string, unknown> | null = null;

      if (args.where.id) {
        const snap = await col.doc(args.where.id).get();
        result = docToObj(snap);
      } else if (args.where.userId) {
        const q = col.where("userId", "==", args.where.userId).limit(1);
        const snap = await q.get();
        if (!snap.empty) {
          result = { id: snap.docs[0].id, ...serializeTimestamps(snap.docs[0].data()!) };
        }
      }

      if (!result) return null;
      if (args.select) {
        return applySelect(result, args.select);
      }
      return result;
    },

    async findFirst(args?: { where?: Record<string, unknown>; select?: Record<string, boolean> }) {
      const col = firestore.collection(COLLECTIONS.users);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);
      q = q.limit(1);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (results.length === 0) return null;

      if (args?.select) {
        return applySelect(results[0], args.select);
      }

      return results[0];
    },

    async findMany(args?: {
      where?: Record<string, unknown>;
      select?: Record<string, boolean>;
      orderBy?: Record<string, string> | Array<Record<string, string>>;
    }) {
      const col = firestore.collection(COLLECTIONS.users);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (args?.select) {
        results = results.map((item) => applySelect(item, args.select!));
      }

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      return results;
    },

    async create(args: { data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.users);
      const now = Timestamp.now();
      const data = toFirestoreData({
        ...args.data,
        createdAt: now,
        updatedAt: now,
      });

      // Use userId as document ID for easy lookup
      const userId = args.data.userId as string;
      const docRef = col.doc(userId);
      await docRef.set(data);

      const snap = await docRef.get();
      return docToObj(snap);
    },

    async update(args: { where: { id?: string; userId?: string }; data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.users);
      let docId = args.where.id as string;

      if (!docId && args.where.userId) {
        const q = col.where("userId", "==", args.where.userId).limit(1);
        const snap = await q.get();
        if (snap.empty) throw new Error("User not found");
        docId = snap.docs[0].id;
      }

      const docRef = col.doc(docId);
      const updateData = toFirestoreData({
        ...args.data,
        updatedAt: Timestamp.now(),
      });

      await docRef.update(updateData);
      const snap = await docRef.get();
      return docToObj(snap);
    },

    async delete(args: { where: { id: string } }) {
      const col = firestore.collection(COLLECTIONS.users);
      await col.doc(args.where.id).delete();
      return { id: args.where.id };
    },
  },

  attendance: {
    async findUnique(args: { where: { id?: string; userId_date?: { userId: string; date: string } }; select?: Record<string, boolean> }) {
      const col = firestore.collection(COLLECTIONS.attendance);

      let result: Record<string, unknown> | null = null;

      if (args.where.id) {
        const snap = await col.doc(args.where.id).get();
        result = docToObj(snap);
      } else if (args.where.userId_date) {
        const { userId, date } = args.where.userId_date;
        const docId = attendanceDocId(userId, date);
        const snap = await col.doc(docId).get();
        result = docToObj(snap);
      }

      if (!result) return null;
      if (args.select) {
        return applySelect(result, args.select);
      }
      return result;
    },

    async findMany(args?: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: Record<string, string> | Array<Record<string, string>>;
    }) {
      const col = firestore.collection(COLLECTIONS.attendance);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (args?.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        results = results.map((record) => {
          const user = userMap.get(record.userId as string) || null;
          return { ...record, user: applyUserSelect(user, userSelect) };
        });
      }

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      return results;
    },

    async create(args: { data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.attendance);
      const data = toFirestoreData({
        ...args.data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const userId = args.data.userId as string;
      const date = args.data.date as string;
      const docId = attendanceDocId(userId, date);
      const docRef = col.doc(docId);
      await docRef.set(data);

      const snap = await docRef.get();
      return docToObj(snap);
    },

    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.attendance);
      const docRef = col.doc(args.where.id);
      const updateData = toFirestoreData({
        ...args.data,
        updatedAt: Timestamp.now(),
      });

      await docRef.update(updateData);
      const snap = await docRef.get();
      return docToObj(snap);
    },

    async upsert(args: {
      where: { userId_date: { userId: string; date: string } };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) {
      const col = firestore.collection(COLLECTIONS.attendance);
      const { userId, date } = args.where.userId_date;
      const docId = attendanceDocId(userId, date);
      const docRef = col.doc(docId);

      const snap = await docRef.get();
      const now = Timestamp.now();

      if (snap.exists) {
        const updateData = toFirestoreData({ ...args.update, updatedAt: now });
        await docRef.update(updateData);
      } else {
        const createData = toFirestoreData({ ...args.create, createdAt: now, updatedAt: now });
        await docRef.set(createData);
      }

      const newSnap = await docRef.get();
      return docToObj(newSnap);
    },
  },

  subjectAttendance: {
    async findMany(args?: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: Record<string, string> | Array<Record<string, string>>;
    }) {
      const col = firestore.collection(COLLECTIONS.subjectAttendance);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (args?.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        results = results.map((record) => {
          const user = userMap.get(record.userId as string) || null;
          return { ...record, user: applyUserSelect(user, userSelect) };
        });
      }

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      return results;
    },

    async upsert(args: {
      where: { userId_date_subject: { userId: string; date: string; subject: string } };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) {
      const col = firestore.collection(COLLECTIONS.subjectAttendance);
      const { userId, date, subject } = args.where.userId_date_subject;
      const docId = subjectAttendanceDocId(userId, date, subject);
      const docRef = col.doc(docId);

      const snap = await docRef.get();
      const now = Timestamp.now();

      if (snap.exists) {
        const updateData = toFirestoreData({ ...args.update, updatedAt: now });
        await docRef.update(updateData);
      } else {
        const createData = toFirestoreData({ ...args.create, createdAt: now, updatedAt: now });
        await docRef.set(createData);
      }

      const newSnap = await docRef.get();
      return docToObj(newSnap);
    },
  },

  leaveRequest: {
    async findMany(args?: {
      where?: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: Record<string, string> | Array<Record<string, string>>;
    }) {
      const col = firestore.collection(COLLECTIONS.leaveRequests);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (args?.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        results = results.map((record) => {
          const user = userMap.get(record.userId as string) || null;
          return { ...record, user: applyUserSelect(user, userSelect) };
        });
      }

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      return results;
    },

    async findUnique(args: { where: { id: string }; include?: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.leaveRequests);
      const snap = await col.doc(args.where.id).get();
      const record = docToObj(snap);
      if (!record) return null;

      if (args.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        const user = userMap.get(record.userId as string) || null;
        return { ...record, user: applyUserSelect(user, userSelect) };
      }

      return record;
    },

    async create(args: { data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.leaveRequests);
      const now = Timestamp.now();
      const data = toFirestoreData({ ...args.data, createdAt: now, updatedAt: now });

      const docRef = col.doc(); // auto-generated ID
      await docRef.set(data);

      const snap = await docRef.get();
      const record = docToObj(snap);

      if (args.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        const user = userMap.get((record as Record<string, unknown>)?.userId as string) || null;
        return { ...record, user: applyUserSelect(user, userSelect) };
      }

      return record;
    },

    async update(args: { where: { id: string }; data: Record<string, unknown>; include?: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.leaveRequests);
      const docRef = col.doc(args.where.id);
      const updateData = toFirestoreData({ ...args.data, updatedAt: Timestamp.now() });

      await docRef.update(updateData);

      const snap = await docRef.get();
      const record = docToObj(snap);

      if (args.include?.user) {
        const userMap = await getUserMap();
        const userSelect = args.include.user as { select?: Record<string, boolean> } | undefined;
        const user = userMap.get((record as Record<string, unknown>)?.userId as string) || null;
        return { ...record, user: applyUserSelect(user, userSelect) };
      }

      return record;
    },
  },

  holiday: {
    async findMany(args?: { where?: Record<string, unknown>; orderBy?: Record<string, string> | Array<Record<string, string>> }) {
      const col = firestore.collection(COLLECTIONS.holidays);
      const whereClause = args?.where || {};

      let q = buildWhereQuery(col, whereClause);

      const snap = await q.get();
      let results = snap.docs.map((d) => ({ id: d.id, ...serializeTimestamps(d.data()!) }));
      results = filterResults(results, whereClause);

      if (args?.orderBy) {
        results = sortResults(results, args.orderBy);
      }

      return results;
    },

    async findUnique(args: { where: { id: string } }) {
      const col = firestore.collection(COLLECTIONS.holidays);
      const snap = await col.doc(args.where.id).get();
      return docToObj(snap);
    },

    async create(args: { data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.holidays);
      const now = Timestamp.now();
      const data = toFirestoreData({ ...args.data, createdAt: now, updatedAt: now });

      const docRef = col.doc(); // auto-generated ID
      await docRef.set(data);

      const snap = await docRef.get();
      return docToObj(snap);
    },

    async delete(args: { where: { id: string } }) {
      const col = firestore.collection(COLLECTIONS.holidays);
      await col.doc(args.where.id).delete();
      return { id: args.where.id };
    },
  },

  settings: {
    async findFirst() {
      const col = firestore.collection(COLLECTIONS.settings);
      const snap = await col.limit(1).get();

      if (snap.empty) return null;

      const d = snap.docs[0];
      return { id: d.id, ...serializeTimestamps(d.data()!) };
    },

    async create(args: { data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.settings);
      const now = Timestamp.now();
      const data = toFirestoreData({ ...args.data, createdAt: now, updatedAt: now });

      const docRef = col.doc(); // auto-generated ID
      await docRef.set(data);

      const snap = await docRef.get();
      return docToObj(snap);
    },

    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      const col = firestore.collection(COLLECTIONS.settings);
      const docRef = col.doc(args.where.id);
      const updateData = toFirestoreData({ ...args.data, updatedAt: Timestamp.now() });

      await docRef.update(updateData);
      const snap = await docRef.get();
      return docToObj(snap);
    },
  },

  // Transaction — pass `db` as `tx` so that `tx.attendance.create(...)` etc. work
  async $transaction<T>(fn: (tx: typeof db) => Promise<T>): Promise<T> {
    return fn(db);
  },
};
