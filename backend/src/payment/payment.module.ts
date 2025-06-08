import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CheckInRequest } from '../check-in/entities/check-in-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckInRequest])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {} 