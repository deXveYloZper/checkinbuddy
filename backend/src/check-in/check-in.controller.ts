import { Controller, Post, Get, Body, Req, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CreateCheckInRequestDto } from './dto/create-check-in-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('check-in')
export class CheckInController {
  constructor(private checkInService: CheckInService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createCheckInRequest(
    @Req() req: any,
    @Body() createDto: CreateCheckInRequestDto,
  ) {
    const hostId = req.user?.id;
    if (!hostId) {
      throw new HttpException('User not found in token', HttpStatus.UNAUTHORIZED);
    }
    
    // Verify user is a host
    if (req.user?.role !== 'host') {
      throw new HttpException('Only hosts can create check-in requests', HttpStatus.FORBIDDEN);
    }
    
    return this.checkInService.createCheckInRequest(hostId, createDto);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  async findNearbyRequests(
    @Req() req: any,
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number,
  ) {
    // Verify user is an agent
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can view nearby requests', HttpStatus.FORBIDDEN);
    }
    
    return this.checkInService.findNearbyRequests(latitude, longitude, radius);
  }
} 