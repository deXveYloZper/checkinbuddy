import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    // Convert lat/lng to PostGIS POINT geography format
    const locationPoint = `POINT(${locationDto.longitude} ${locationDto.latitude})`;
    
    await this.userRepository.update(userId, { 
      location: locationPoint 
    });
    
    return this.findById(userId);
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.findById(userId);
  }
} 