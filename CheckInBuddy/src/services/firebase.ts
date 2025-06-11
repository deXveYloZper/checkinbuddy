// FirebaseService — React-Native (Expo) wrapper using Firebase JS SDK
// -----------------------------------------------------------------------------
import 'firebase/auth';      // <— registers the Auth component
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';


import {
  initializeAuth,
  getReactNativePersistence,          // ✔ works at runtime
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';                     // ←  no “/react-native” suffix

import AsyncStorage from '@react-native-async-storage/async-storage';

// -----------------------------------------------------------------------------
// Firebase configuration  ⚠️  move to environment variables before production
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'AIzaSyD4LMU_DESdzIKdTSDr-vgG1xCk16XBc8c',
  authDomain: 'checkinbuddy-35c74.firebaseapp.com',
  projectId: 'checkinbuddy-35c74',
  storageBucket: 'checkinbuddy-35c74.appspot.com',
  messagingSenderId: '726369111363',
  appId: '1:726369111363:web:205dab9f0fbe0c432273f6',
  measurementId: 'G-D6WE42KEFZ',
};

// -----------------------------------------------------------------------------
// Initialise Firebase exactly once (supports Expo hot-reload)
// -----------------------------------------------------------------------------
let firebaseApp: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  firebaseApp = getApp();
  auth = getAuth(firebaseApp);
}

// -----------------------------------------------------------------------------
// Auth service — thin wrapper with friendly error messages
// -----------------------------------------------------------------------------
class FirebaseService {
  constructor(private readonly auth: Auth) {}

  /** Currently signed-in user (or null) */
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /** Fresh ID token for backend calls */
  async getIdToken(): Promise<string | null> {
    const user = this.getCurrentUser();
    return user ? user.getIdToken() : null;
  }

  /** Email + password sign-in */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const { user } = await signInWithEmailAndPassword(this.auth, email, password);
    return user;
  }

  /** Email + password registration */
  async signUp(email: string, password: string): Promise<FirebaseUser> {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
    return user;
  }

  /** Sign out */
  async signOut(): Promise<void> {
    await fbSignOut(this.auth);
  }

  /** Send a password-reset e-mail */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /** Listen to auth-state changes (returns unsubscribe fn) */
  onAuthStateChanged(cb: (user: FirebaseUser | null) => void): () => void {
    return this.auth.onAuthStateChanged(cb);
  }

  /* ------------------------- private helpers ------------------------- */
  private handleAuthError(err: unknown): Error {
    if (err && typeof err === 'object' && 'code' in err) {
      const { code, message } = err as { code: string; message?: string };
      const map: Record<string, string> = {
        'auth/user-not-found': 'No account found with this e-mail address',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account with this e-mail already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid e-mail address',
        'auth/too-many-requests': 'Too many attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection',
      };
      return new Error(map[code] ?? message ?? 'Authentication error');
    }
    return new Error((err as Error)?.message ?? 'Authentication error');
  }
}

// -----------------------------------------------------------------------------
// Export singleton + named helpers
// -----------------------------------------------------------------------------
const firebaseService = new FirebaseService(auth);
export default firebaseService;
export { firebaseApp, auth };
