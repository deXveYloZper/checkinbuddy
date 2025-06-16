import { Controller, Get, Put, Body, Req, UseGuards, HttpException, HttpStatus, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInService } from '../check-in/check-in.service';
import { CheckInStatus } from '../check-in/entities/check-in-request.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly checkInService: CheckInService,
  ) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @Get('me/stats')
  async getStats(@Request() req) {
    const requests = await this.checkInService.findByHostId(req.user.id);
    
    const stats = {
      totalRequests: requests.length,
      completedRequests: requests.filter(r => r.status === CheckInStatus.COMPLETED).length,
      cancelledRequests: requests.filter(r => r.status === CheckInStatus.CANCELLED_HOST || r.status === CheckInStatus.CANCELLED_AGENT).length,
      totalSpent: requests
        .filter(r => r.status === CheckInStatus.COMPLETED)
        .reduce((sum, r) => sum + r.fee, 0),
    };

    return stats;
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