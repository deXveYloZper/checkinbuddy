import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

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
        // Create new user if doesn't exist
        user = await this.userService.createUser({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          role: loginDto.role,
          name: decodedToken.name || loginDto.name || 'User',
          phone: loginDto.phone || '',
        });
      }
      
      // Generate app-specific JWT for subsequent API calls
      const appToken = await this.authService.generateAppJWT(
        decodedToken.uid,
        decodedToken.email || '',
        user.role,
        user.id,
      );
      
      return {
        message: 'Login successful',
        ...appToken,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
} 