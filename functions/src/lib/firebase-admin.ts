'use server';

import admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    const serviceAccountString = process.env.SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error(
        'SERVICE_ACCOUNT_KEY secret is not available. Make sure it is configured in Firebase Functions.'
      );
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized with SERVICE_ACCOUNT_KEY secret.');
  }

  return {
    adminApp,
    adminDb: adminApp.firestore(),
    adminAuth: adminApp.auth(),
  };
}
