import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async verifyFirebaseToken(token: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }
  }

  async generateAppJWT(firebaseUid: string, email: string, role: string) {
    // TODO: Implement JWT generation for app-specific tokens
    // This will be used for subsequent API calls after Firebase verification
    return {
      access_token: `temp-jwt-${firebaseUid}`, // Placeholder
      user: { firebaseUid, email, role },
    };
  }
} 