import { Controller, Post, Get, Put, Param, Body, Req, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CheckInService } from './check-in.service';
import { CreateCheckInRequestDto } from './dto/create-check-in-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckInStatus } from './entities/check-in-request.entity';

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

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async getMyRequests(@Req() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      throw new HttpException('User not found in token', HttpStatus.UNAUTHORIZED);
    }
    
    if (userRole === 'host') {
      return this.checkInService.findByHostId(userId);
    } else if (userRole === 'agent') {
      return this.checkInService.findByAgentId(userId);
    } else {
      throw new HttpException('Invalid user role', HttpStatus.FORBIDDEN);
    }
  }

  @Get('agent/stats')
  @UseGuards(JwtAuthGuard)
  async getAgentStats(@Req() req: any) {
    // Verify user is an agent
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can view their stats', HttpStatus.FORBIDDEN);
    }
    
    const agentId = req.user?.id;
    return this.checkInService.getAgentStats(agentId);
  }

  @Get('agent/requests')
  @UseGuards(JwtAuthGuard)
  async getAgentRequests(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    // Verify user is an agent
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can view their requests', HttpStatus.FORBIDDEN);
    }
    
    const agentId = req.user?.id;
    return this.checkInService.getAgentRequests(agentId, status, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getRequestById(@Param('id') id: string, @Req() req: any) {
    const request = await this.checkInService.findById(id);
    
    if (!request) {
      throw new HttpException('Check-in request not found', HttpStatus.NOT_FOUND);
    }
    
    // Verify user has access to this request
    const userId = req.user?.id;
    if (request.hostId !== userId && request.agentId !== userId) {
      throw new HttpException('Access denied to this request', HttpStatus.FORBIDDEN);
    }
    
    return request;
  }

  @Put(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptRequest(@Param('id') id: string, @Req() req: any) {
    // Verify user is an agent
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can accept requests', HttpStatus.FORBIDDEN);
    }
    
    const agentId = req.user?.id;
    const request = await this.checkInService.findById(id);
    
    if (!request) {
      throw new HttpException('Check-in request not found', HttpStatus.NOT_FOUND);
    }
    
    if (request.status !== CheckInStatus.PENDING) {
      throw new HttpException('Request is not available for acceptance', HttpStatus.BAD_REQUEST);
    }
    
    return this.checkInService.acceptRequest(id, agentId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CheckInStatus; reason?: string },
    @Req() req: any
  ) {
    const request = await this.checkInService.findById(id);
    
    if (!request) {
      throw new HttpException('Check-in request not found', HttpStatus.NOT_FOUND);
    }
    
    // Verify user has permission to update status
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (request.hostId !== userId && request.agentId !== userId) {
      throw new HttpException('Access denied to this request', HttpStatus.FORBIDDEN);
    }
    
    // Validate status transitions
    const allowedTransitions = this.getAllowedStatusTransitions(request.status, userRole);
    if (!allowedTransitions.includes(body.status)) {
      throw new HttpException(`Cannot transition from ${request.status} to ${body.status}`, HttpStatus.BAD_REQUEST);
    }
    
    return this.checkInService.updateStatus(id, body.status, body.reason);
  }

  @Put(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeCheckIn(@Param('id') id: string, @Req() req: any) {
    // Verify user is an agent
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can complete check-ins', HttpStatus.FORBIDDEN);
    }
    
    const request = await this.checkInService.findById(id);
    
    if (!request) {
      throw new HttpException('Check-in request not found', HttpStatus.NOT_FOUND);
    }
    
    if (request.agentId !== req.user?.id) {
      throw new HttpException('Only assigned agent can complete this request', HttpStatus.FORBIDDEN);
    }
    
    if (request.status !== CheckInStatus.IN_PROGRESS) {
      throw new HttpException('Request must be in progress to complete', HttpStatus.BAD_REQUEST);
    }
    
    return this.checkInService.completeCheckIn(id);
  }

  private getAllowedStatusTransitions(currentStatus: CheckInStatus, userRole: string): CheckInStatus[] {
    const transitions: Record<string, Record<string, CheckInStatus[]>> = {
      [CheckInStatus.PENDING]: {
        host: [CheckInStatus.CANCELLED_HOST],
        agent: [CheckInStatus.ACCEPTED]
      },
      [CheckInStatus.ACCEPTED]: {
        host: [CheckInStatus.CANCELLED_HOST],
        agent: [CheckInStatus.IN_PROGRESS, CheckInStatus.CANCELLED_AGENT]
      },
      [CheckInStatus.IN_PROGRESS]: {
        host: [],
        agent: [CheckInStatus.COMPLETED, CheckInStatus.CANCELLED_AGENT]
      }
    };
    
    return transitions[currentStatus]?.[userRole] || [];
  }
} 