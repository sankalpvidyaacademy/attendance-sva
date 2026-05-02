import * as admin from "firebase-admin";

// Firebase Admin SDK initialization
// Uses environment variables for secure config (works on Vercel too)

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "YOUR_CLIENT_EMAIL",
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "YOUR_PRIVATE_KEY").replace(
    /\\n/g,
    "\n"
  ),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export default admin;
