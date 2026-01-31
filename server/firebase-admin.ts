import admin from "firebase-admin";

let app: admin.app.App;

export function initializeFirebaseAdmin(): admin.app.App {
  if (app) {
    return app;
  }

  try {
    // Try to use service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccount) {
      try {
        const serviceAccountObj = JSON.parse(serviceAccount);
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountObj),
        });
        console.log("Firebase Admin initialized with service account");
      } catch (parseError) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", parseError);
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
      }
    } else {
      // Use application default credentials for development
      console.warn("FIREBASE_SERVICE_ACCOUNT not set, using application default credentials");
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log("Firebase Admin initialized with application default credentials");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw error;
  }

  return app;
}

export function getAuth(): admin.auth.Auth {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return admin.auth(app);
}

export const auth = getAuth();
