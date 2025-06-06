import { IsNotEmpty, IsString, IsDateString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateCheckInRequestDto {
  @IsNotEmpty()
  @IsString()
  propertyAddress: string;

  @IsNotEmpty()
  @IsString()
  guestName: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number = 1;

  @IsNotEmpty()
  @IsDateString()
  checkInTime: string;
} 