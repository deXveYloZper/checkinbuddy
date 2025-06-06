import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckInRequest, CheckInStatus } from './entities/check-in-request.entity';
import { CreateCheckInRequestDto } from './dto/create-check-in-request.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckInRequest)
    private checkInRepository: Repository<CheckInRequest>,
  ) {}

  async createCheckInRequest(
    hostId: string, 
    createDto: CreateCheckInRequestDto
  ): Promise<CheckInRequest> {
    const checkInRequest = this.checkInRepository.create({
      hostId,
      ...createDto,
      checkInTime: new Date(createDto.checkInTime),
    });

    return this.checkInRepository.save(checkInRequest);
  }

  async findNearbyRequests(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<CheckInRequest[]> {
    // TODO: Implement PostGIS query for nearby requests
    // For now, return all pending requests
    return this.checkInRepository.find({
      where: { status: CheckInStatus.PENDING },
      relations: ['host'],
    });
  }

  async findById(id: string): Promise<CheckInRequest | null> {
    return this.checkInRepository.findOne({
      where: { id },
      relations: ['host', 'agent'],
    });
  }

  async findByHostId(hostId: string): Promise<CheckInRequest[]> {
    return this.checkInRepository.find({
      where: { hostId },
      relations: ['agent'],
    });
  }
} 