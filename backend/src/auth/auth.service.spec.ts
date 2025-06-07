import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                JWT_SECRET: 'test-secret',
                FIREBASE_PROJECT_ID: undefined,
                FIREBASE_CLIENT_EMAIL: undefined,
                FIREBASE_PRIVATE_KEY: undefined,
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-jwt-token'),
            verify: jest.fn(() => ({
              sub: 'firebase-uid',
              email: 'test@example.com',
              role: 'host',
              userId: 'user-id-123',
            })),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAppJWT', () => {
    it('should generate a JWT token with user information', async () => {
      const result = await service.generateAppJWT(
        'firebase-uid',
        'test@example.com',
        'host',
        'user-id-123'
      );

      expect(result).toEqual({
        access_token: 'test-jwt-token',
        user: {
          firebaseUid: 'firebase-uid',
          email: 'test@example.com',
          role: 'host',
          userId: 'user-id-123',
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'firebase-uid',
        email: 'test@example.com',
        role: 'host',
        userId: 'user-id-123',
        iat: expect.any(Number),
      });
    });
  });

  describe('verifyAppJWT', () => {
    it('should verify a JWT token and return payload', async () => {
      const result = await service.verifyAppJWT('test-jwt-token');

      expect(result).toEqual({
        sub: 'firebase-uid',
        email: 'test@example.com',
        role: 'host',
        userId: 'user-id-123',
      });

      expect(jwtService.verify).toHaveBeenCalledWith('test-jwt-token');
    });

    it('should throw error for invalid token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyAppJWT('invalid-token')).rejects.toThrow('Invalid JWT token');
    });
  });
}); 