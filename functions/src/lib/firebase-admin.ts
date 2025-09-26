'use server';

import admin from "firebase-admin";

// Global cache for the initialized Firebase Admin app
let firebaseAdminApp: admin.app.App | null = null;

function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseAdminApp) return firebaseAdminApp;

  const serviceAccountString = process.env.SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
    throw new Error(
      "SERVICE_ACCOUNT_KEY environment variable is not set. The application cannot connect to Firebase services."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    if (!admin.apps.length) {
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } else {
      firebaseAdminApp = admin.app(); // reuse existing app
    }
  } catch (error: any) {
    console.error(
      "Failed to parse SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:",
      error
    );
    throw new Error(
      "Could not initialize Firebase Admin SDK. Please check the service account key format."
    );
  }

  return firebaseAdminApp;
}

export function getFirebaseAdmin() {
  const app = initializeFirebaseAdmin();
  return {
    adminApp: app,
    adminDb: app.firestore(),
    adminAuth: app.auth(),
  };
}
