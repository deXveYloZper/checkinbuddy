import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;
} 