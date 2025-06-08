import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum CheckInStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED_HOST = 'cancelled_host',
  CANCELLED_AGENT = 'cancelled_agent',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('check_in_requests')
export class CheckInRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'host_id' })
  hostId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_id' })
  host: User;

  @Column({ name: 'agent_id', nullable: true })
  agentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ name: 'property_address', type: 'text' })
  propertyAddress: string;

  @Column({ 
    type: 'geography', 
    spatialFeatureType: 'Point', 
    srid: 4326, 
    nullable: true,
    name: 'property_location' 
  })
  propertyLocation: string; // PostGIS geography point

  @Column({ name: 'guest_name' })
  guestName: string;

  @Column({ name: 'guest_count', default: 1 })
  guestCount: number;

  @Column({ name: 'check_in_time' })
  checkInTime: Date;

  @Column({ 
    type: 'enum', 
    enum: CheckInStatus, 
    default: CheckInStatus.PENDING 
  })
  status: CheckInStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fee: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    name: 'platform_fee',
    nullable: true
  })
  platformFee: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    name: 'agent_payout',
    nullable: true
  })
  agentPayout: number;

  @Column({ nullable: true, name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ 
    type: 'enum', 
    enum: PaymentStatus, 
    default: PaymentStatus.PENDING,
    name: 'payment_status'
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 