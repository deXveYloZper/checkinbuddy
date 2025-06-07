import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto, UserRole } from './dto/login.dto';
import { User, VerificationStatus } from '../user/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            verifyFirebaseToken: jest.fn(),
            generateAppJWT: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByFirebaseUid: jest.fn(),
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      firebaseToken: 'valid-firebase-token',
      role: UserRole.HOST,
      name: 'John Doe',
      phone: '+1234567890',
    };

    const mockFirebaseUser = {
      uid: 'firebase-uid-123',
      email: 'john@example.com',
      name: 'John Doe',
      aud: 'test-aud',
      auth_time: 1234567890,
      exp: 1234567890,
      firebase: { identities: {}, sign_in_provider: 'password' },
      iat: 1234567890,
      iss: 'test-issuer',
      sub: 'firebase-uid-123',
    };

    const mockDbUser: User = {
      id: 'user-id-123',
      firebaseUid: 'firebase-uid-123',
      email: 'john@example.com',
      role: UserRole.HOST,
      name: 'John Doe',
      phone: '+1234567890',
      location: null,
      verificationStatus: VerificationStatus.PENDING,
      stripeAccountId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login existing user successfully', async () => {
      jest.spyOn(authService, 'verifyFirebaseToken').mockResolvedValue(mockFirebaseUser);
      jest.spyOn(userService, 'findByFirebaseUid').mockResolvedValue(mockDbUser);
      jest.spyOn(authService, 'generateAppJWT').mockResolvedValue({
        access_token: 'app-jwt-token',
        user: mockDbUser,
      });

      const result = await controller.login(mockLoginDto);

      expect(result).toEqual({
        message: 'Login successful',
        access_token: 'app-jwt-token',
        user: mockDbUser,
      });

      expect(authService.verifyFirebaseToken).toHaveBeenCalledWith('valid-firebase-token');
      expect(userService.findByFirebaseUid).toHaveBeenCalledWith('firebase-uid-123');
      expect(authService.generateAppJWT).toHaveBeenCalledWith(
        'firebase-uid-123',
        'john@example.com',
        UserRole.HOST,
        'user-id-123'
      );
    });

    it('should create new user and login successfully', async () => {
      jest.spyOn(authService, 'verifyFirebaseToken').mockResolvedValue(mockFirebaseUser);
      jest.spyOn(userService, 'findByFirebaseUid').mockResolvedValue(null); // User doesn't exist
      jest.spyOn(userService, 'createUser').mockResolvedValue(mockDbUser);
      jest.spyOn(authService, 'generateAppJWT').mockResolvedValue({
        access_token: 'app-jwt-token',
        user: mockDbUser,
      });

      const result = await controller.login(mockLoginDto);

      expect(result).toEqual({
        message: 'Login successful',
        access_token: 'app-jwt-token',
        user: mockDbUser,
      });

      expect(userService.createUser).toHaveBeenCalledWith({
        firebaseUid: 'firebase-uid-123',
        email: 'john@example.com',
        role: UserRole.HOST,
        name: 'John Doe',
        phone: '+1234567890',
      });
    });

    it('should throw error for invalid Firebase token', async () => {
      jest.spyOn(authService, 'verifyFirebaseToken').mockRejectedValue(
        new Error('Invalid Firebase token')
      );

      await expect(controller.login(mockLoginDto)).rejects.toThrow(HttpException);
      await expect(controller.login(mockLoginDto)).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });
}); 