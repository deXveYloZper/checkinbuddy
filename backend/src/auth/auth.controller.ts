import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto, UserRole } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      // Verify Firebase token
      const decodedToken = await this.authService.verifyFirebaseToken(loginDto.firebaseToken);
      
      // Find or create user in our database
      let user = await this.userService.findByFirebaseUid(decodedToken.uid);
      
      if (!user) {
        // If role is not provided in the request, default to host
        const role = loginDto.role || UserRole.HOST;
        
        // Create new user if doesn't exist
        user = await this.userService.createUser({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          role: role,
          name: decodedToken.name || loginDto.name || 'User',
          phone: loginDto.phone || '',
        });
      }
      
      // Generate app-specific JWT for subsequent API calls
      const { access_token, user: userData } = await this.authService.generateAppJWT(
        decodedToken.uid,
        decodedToken.email || '',
        user.role,
        user.id,
      );
      
      return {
        token: access_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          phone: user.phone,
          firebaseUid: user.firebaseUid,
          verificationStatus: user.verificationStatus,
          location: user.location,
          stripeAccountId: user.stripeAccountId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new HttpException(
        error.message || 'Authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
} 