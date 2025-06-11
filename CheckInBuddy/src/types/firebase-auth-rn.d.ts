//  src/types/firebase-auth-rn.d.ts
//  --------------------------------------------------------------
//  Adds the two React-Native helpers that Firebase forgot to type
//  --------------------------------------------------------------
declare module 'firebase/auth' {
  import type { Persistence, Auth } from '@firebase/auth';
  import type { FirebaseApp } from 'firebase/app';

  /** AsyncStorage-backed persistence for React Native */
  export function getReactNativePersistence(storage: any): Persistence;

  /** Allows custom persistence on React Native */
  export function initializeAuth(
    app: FirebaseApp,
    options?: { persistence: Persistence | Persistence[] }
  ): Auth;
}
