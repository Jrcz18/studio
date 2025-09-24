
'use server';

import admin from 'firebase-admin';

// This is a global cache for the initialized Firebase Admin app.
// It prevents re-initializing the app on every hot-reload in development.
let firebaseAdminApp: admin.app.App;

async function initializeFirebaseAdmin() {
  if (!firebaseAdminApp) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application cannot connect to Firebase services on the backend.');
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      
      // Initialize the app if it hasn't been initialized yet
      if (!admin.apps.length) {
        firebaseAdminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        });
        console.log("Firebase Admin SDK initialized successfully.");
      } else {
        firebaseAdminApp = admin.app(); // Use the existing app
      }
    } catch (error: any) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:", error);
      throw new Error('Could not initialize Firebase Admin SDK. Please check the service account key format in your environment variables.');
    }
  }
  return firebaseAdminApp;
}

export async function getFirebaseAdmin() {
  const app = await initializeFirebaseAdmin();
  return {
    adminApp: app,
    adminDb: app.firestore(),
    adminAuth: app.auth(),
  };
}
