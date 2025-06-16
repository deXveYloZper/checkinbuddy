import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/* ──────────────────────────────────────────────────────────
 *  Entities & DTOs
 * ────────────────────────────────────────────────────────── */
import { User } from '../user/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthTokensDto, TokenPayloadDto } from './dto/auth-tokens.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  /* ------------------------------------------------------
   *  Firebase Admin bootstrap (runs once per process)
   * ------------------------------------------------------ */
  onModuleInit(): void {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[AuthService] Firebase credentials missing – auth disabled');
      return;
    }

    this.firebaseApp =
      admin.apps.length === 0
        ? admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          })
        : admin.app();
  }

  /* ------------------------------------------------------
   *  Firebase token helpers
   * ------------------------------------------------------ */
  async verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) throw new Error('Firebase not configured');
    try {
      return await admin.auth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  /* ------------------------------------------------------
   *  JWT helpers
   * ------------------------------------------------------ */
  private buildJwtPayload(user: User): TokenPayloadDto {
    return {
      /** Primary identifier used by guards / strategies */
      id: user.id,
      /** Firebase UID kept for convenience */
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
    };
  }

  private async signAccessToken(payload: TokenPayloadDto): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRATION') ?? '1h',
    });
  }

  private async signRefreshToken(payload: TokenPayloadDto): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRATION') ?? '7d',
    });
  }

  /* ------------------------------------------------------
   *  Public token generators
   * ------------------------------------------------------ */
  async generateTokens(user: User): Promise<AuthTokensDto> {
    const payload = this.buildJwtPayload(user);

    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: '1h',
      user,
      message: 'Login successful',
    };
  }

  /* ------------------------------------------------------
   *  Refresh‑token flow
   * ------------------------------------------------------ */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokensDto> {
    const tokenRecord = await this.refreshTokens.findOne({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.users.findOne({ where: { id: tokenRecord.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Revoke old token & issue new pair
    await this.refreshTokens.update(tokenRecord.id, { isRevoked: true });
    return this.generateTokens(user);
  }

  /* ------------------------------------------------------
   *  Revoke helpers
   * ------------------------------------------------------ */
  async revokeRefreshToken(token: string): Promise<void> {
    const { affected } = await this.refreshTokens.update(
      { token, isRevoked: false },
      { isRevoked: true },
    );
    if (affected === 0) throw new BadRequestException('Invalid refresh token');
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokens.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  /* ------------------------------------------------------
   *  Legacy helpers (kept for compatibility)
   * ------------------------------------------------------ */
  async verifyAppJWT(token: string) {
    try {
      return this.jwt.verify<TokenPayloadDto>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  async validateUser(firebaseUid: string): Promise<User | null> {
    return this.users.findOne({ where: { firebaseUid } });
  }

  /* ------------------------------------------------------
   *  Refresh‑token persistence helpers (optional)
   * ------------------------------------------------------ */
  private async persistRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.refreshTokens.save({ userId, token, expiresAt, ipAddress, userAgent });
    return token;
  }
}
