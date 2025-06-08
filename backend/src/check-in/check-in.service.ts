import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CheckInRequest, CheckInStatus, PaymentStatus } from './entities/check-in-request.entity';
import { CreateCheckInRequestDto } from './dto/create-check-in-request.dto';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(CheckInRequest)
    private checkInRepository: Repository<CheckInRequest>,
    private configService: ConfigService,
  ) {}

  async createCheckInRequest(
    hostId: string, 
    createDto: CreateCheckInRequestDto
  ): Promise<CheckInRequest> {
    // Create the basic check-in request
    const checkInRequest = this.checkInRepository.create({
      hostId,
      ...createDto,
      checkInTime: new Date(createDto.checkInTime),
      fee: 20.00, // Fixed fee as per development plan
    });

    const savedRequest = await this.checkInRepository.save(checkInRequest);

    // TODO: Geocode the property address to set property_location
    // For now, we'll implement a basic version and enhance with Mapbox later
    await this.geocodeAndUpdateLocation(savedRequest.id, createDto.propertyAddress);

    const updatedRequest = await this.findById(savedRequest.id);
    return updatedRequest || savedRequest;
  }

  async findNearbyRequests(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<CheckInRequest[]> {
    // Use PostGIS to find check-in requests within specified radius
    const point = `POINT(${longitude} ${latitude})`;
    
    return this.checkInRepository.query(
      `SELECT cr.*, 
              u.name as host_name, 
              u.email as host_email,
              u.phone as host_phone,
              ST_Distance(cr.property_location, ST_GeogFromText($1)) as distance_meters
       FROM check_in_requests cr
       JOIN users u ON cr.host_id = u.id
       WHERE cr.status = $2 
         AND cr.property_location IS NOT NULL
         AND ST_DWithin(cr.property_location, ST_GeogFromText($1), $3)
         AND cr.check_in_time > NOW()
         AND cr.payment_status = $4
       ORDER BY distance_meters ASC`,
      [point, CheckInStatus.PENDING, radiusKm * 1000, PaymentStatus.SUCCEEDED] // Convert km to meters
    );
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
      order: { createdAt: 'DESC' }
    });
  }

  async findByAgentId(agentId: string): Promise<CheckInRequest[]> {
    return this.checkInRepository.find({
      where: { agentId },
      relations: ['host'],
      order: { createdAt: 'DESC' }
    });
  }

  async acceptRequest(requestId: string, agentId: string): Promise<CheckInRequest | null> {
    // Use atomic update with WHERE clause to prevent race condition
    // Only update if status is still 'pending' and payment is succeeded
    const result = await this.checkInRepository
      .createQueryBuilder()
      .update(CheckInRequest)
      .set({
        agentId,
        status: CheckInStatus.ACCEPTED
      })
      .where('id = :requestId', { requestId })
      .andWhere('status = :status', { status: CheckInStatus.PENDING })
      .andWhere('payment_status = :paymentStatus', { paymentStatus: PaymentStatus.SUCCEEDED })
      .execute();

    // Check if the update actually modified a row
    if (result.affected === 0) {
      // Request was already accepted by another agent, status changed, or payment not succeeded
      throw new Error('Request is no longer available, has already been accepted, or payment is not completed');
    }

    return this.findById(requestId);
  }

  async updateStatus(requestId: string, status: CheckInStatus, reason?: string): Promise<CheckInRequest | null> {
    const updateData: any = { status };
    if (reason) {
      updateData.cancellationReason = reason;
    }
    
    await this.checkInRepository.update(requestId, updateData);
    return this.findById(requestId);
  }

  async completeCheckIn(requestId: string): Promise<CheckInRequest | null> {
    await this.checkInRepository.update(requestId, {
      status: CheckInStatus.COMPLETED
    });
    return this.findById(requestId);
  }

  private async geocodeAndUpdateLocation(requestId: string, address: string): Promise<void> {
    // Basic geocoding implementation - in production, use Mapbox Geocoding API
    // For now, we'll set a default location (Rome, Italy) for development
    const defaultRomeLocation = 'POINT(12.4964 41.9028)';
    
    try {
      // TODO: Implement actual geocoding with Mapbox SDK
      // const geocodeResult = await this.geocodeAddress(address);
      
      await this.checkInRepository.query(
        `UPDATE check_in_requests SET property_location = ST_GeogFromText($1) WHERE id = $2`,
        [defaultRomeLocation, requestId]
      );
    } catch (error) {
      console.error('Geocoding failed for address:', address, error);
      // Continue without setting location - can be handled later
    }
  }

  async getAllRequestsWithStatus(status: CheckInStatus): Promise<CheckInRequest[]> {
    return this.checkInRepository.find({
      where: { status },
      relations: ['host', 'agent'],
      order: { createdAt: 'DESC' }
    });
  }

  async getRequestsNearLocation(latitude: number, longitude: number, radiusKm: number = 50): Promise<CheckInRequest[]> {
    // Administrative query for viewing all requests near a location
    const point = `POINT(${longitude} ${latitude})`;
    
    return this.checkInRepository.query(
      `SELECT cr.*, 
              u.name as host_name,
              a.name as agent_name,
              ST_Distance(cr.property_location, ST_GeogFromText($1)) as distance_meters
       FROM check_in_requests cr
       JOIN users u ON cr.host_id = u.id
       LEFT JOIN users a ON cr.agent_id = a.id
       WHERE cr.property_location IS NOT NULL
         AND ST_DWithin(cr.property_location, ST_GeogFromText($1), $2)
       ORDER BY cr.created_at DESC`,
      [point, radiusKm * 1000]
    );
  }
} 