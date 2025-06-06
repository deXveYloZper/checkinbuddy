import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const decodedToken = await this.authService.verifyFirebaseToken(loginDto.firebaseToken);
      
      // Generate app-specific JWT for subsequent API calls
      const appToken = await this.authService.generateAppJWT(
        decodedToken.uid,
        decodedToken.email || '',
        loginDto.role,
      );
      
      return {
        message: 'Login successful',
        ...appToken,
      };
    } catch (error) {
      throw new HttpException(
        'Authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
} 