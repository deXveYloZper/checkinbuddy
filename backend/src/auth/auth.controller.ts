import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto, AuthTokensDto } from './dto/auth-tokens.dto';
import { Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const decodedToken = await this.authService.verifyFirebaseToken(loginDto.firebaseToken);
      let user = await this.userService.findByFirebaseUid(decodedToken.uid);

      if (!user) {
        user = await this.userService.createUser({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          role: loginDto.role,
          name: loginDto.name,
          phone: loginDto.phone,
        });
      }

      const { accessToken, refreshToken } = await this.authService.generateTokens(user);
      return {
        message: 'Login successful',
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      throw new HttpException('Invalid Firebase token', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthTokensDto> {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: any) {
    const userId = req.user.id;
    await this.authService.revokeAllUserTokens(userId);
    return { message: 'All sessions logged out successfully' };
  }
} 