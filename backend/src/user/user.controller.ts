import { Controller, Get, Put, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not found in token', HttpStatus.UNAUTHORIZED);
    }
    
    const user = await this.userService.getProfile(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    
    return user;
  }

  @Put('me/location')
  async updateLocation(@Req() req: any, @Body() locationDto: UpdateLocationDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('User not found in token', HttpStatus.UNAUTHORIZED);
    }
    
    const user = await this.userService.updateLocation(userId, locationDto);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    
    return user;
  }
} 