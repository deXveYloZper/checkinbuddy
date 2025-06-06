import { Controller, Post, Get, Body, Req, Query } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CreateCheckInRequestDto } from './dto/create-check-in-request.dto';

@Controller('check-in')
export class CheckInController {
  constructor(private checkInService: CheckInService) {}

  @Post()
  async createCheckInRequest(
    @Req() req: any,
    @Body() createDto: CreateCheckInRequestDto,
  ) {
    // TODO: Extract host ID from JWT token once auth guard is implemented
    const hostId = req.user?.id; // Placeholder
    return this.checkInService.createCheckInRequest(hostId, createDto);
  }

  @Get('nearby')
  async findNearbyRequests(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.checkInService.findNearbyRequests(latitude, longitude, radius);
  }
} 