import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';
import { CheckInRequest } from './entities/check-in-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckInRequest])],
  controllers: [CheckInController],
  providers: [CheckInService],
  exports: [CheckInService],
})
export class CheckInModule {} 