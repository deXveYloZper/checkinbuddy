import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from './entities/user.entity';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { firebaseUid } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateLocation(userId: string, locationDto: UpdateLocationDto): Promise<User | null> {
    // Convert lat/lng to PostGIS POINT geography format (WGS84)
    const locationPoint = `POINT(${locationDto.longitude} ${locationDto.latitude})`;
    
    await this.userRepository.query(
      `UPDATE users SET location = ST_GeogFromText($1) WHERE id = $2`,
      [locationPoint, userId]
    );
    
    return this.findById(userId);
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.findById(userId);
  }

  async findNearbyAgents(latitude: number, longitude: number, radiusKm: number = 10): Promise<User[]> {
    // Find agents within specified radius using PostGIS
    const point = `POINT(${longitude} ${latitude})`;
    
    return this.userRepository.query(
      `SELECT u.*, ST_Distance(u.location, ST_GeogFromText($1)) as distance_meters
       FROM users u 
       WHERE u.role = 'agent' 
         AND u.location IS NOT NULL
         AND ST_DWithin(u.location, ST_GeogFromText($1), $2)
       ORDER BY distance_meters ASC`,
      [point, radiusKm * 1000] // Convert km to meters
    );
  }

  async updateUserDetails(userId: string, updateData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(userId, updateData);
    return this.findById(userId);
  }

  async getAllAgents(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.AGENT },
      select: ['id', 'name', 'email', 'verificationStatus', 'createdAt']
    });
  }

  async getAllHosts(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.HOST },
      select: ['id', 'name', 'email', 'verificationStatus', 'createdAt']
    });
  }
} 