import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  HOST = 'host',
  AGENT = 'agent',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  name: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ unique: true, name: 'firebase_uid' })
  firebaseUid: string;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  location: string; // PostGIS geography point

  @Column({ 
    type: 'enum', 
    enum: VerificationStatus, 
    default: VerificationStatus.PENDING,
    name: 'verification_status' 
  })
  verificationStatus: VerificationStatus;

  @Column({ nullable: true, name: 'stripe_account_id' })
  stripeAccountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 