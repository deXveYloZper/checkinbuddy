import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsUUID()
  checkInRequestId: string;
} 