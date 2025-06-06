import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    // TODO: Extract user ID from JWT token once auth guard is implemented
    const userId = req.user?.id; // Placeholder
    return this.userService.getProfile(userId);
  }

  @Put('me/location')
  async updateLocation(@Req() req: any, @Body() locationDto: UpdateLocationDto) {
    // TODO: Extract user ID from JWT token once auth guard is implemented
    const userId = req.user?.id; // Placeholder
    return this.userService.updateLocation(userId, locationDto);
  }
} 