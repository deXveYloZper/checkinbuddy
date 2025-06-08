import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CheckInRequest } from '../../check-in/entities/check-in-request.entity';
import { User } from '../../user/entities/user.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'check_in_request_id' })
  checkInRequestId: string;

  @ManyToOne(() => CheckInRequest)
  @JoinColumn({ name: 'check_in_request_id' })
  checkInRequest: CheckInRequest;

  @Column({ name: 'uploader_id', nullable: true })
  uploaderId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'uploader_id' })
  uploader: User;

  @Column({ name: 'file_key', length: 1024 })
  fileKey: string; // S3 object key

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_type', length: 50 })
  fileType: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date; // For 48-hour deletion cron job

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
} 