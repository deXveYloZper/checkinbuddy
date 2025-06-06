import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK only if credentials are available
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        this.firebaseApp = admin.app();
      }
    } else {
      console.warn('Firebase credentials not configured. Auth module will not function properly.');
    }
  }

  async verifyFirebaseToken(token: string) {
    if (!this.firebaseApp) {
      throw new Error('Firebase not configured');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }
  }

  async generateAppJWT(firebaseUid: string, email: string, role: string, userId?: string) {
    const payload = {
      sub: firebaseUid,
      email,
      role,
      userId,
      iat: Math.floor(Date.now() / 1000),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { firebaseUid, email, role, userId },
    };
  }

  async verifyAppJWT(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
} 