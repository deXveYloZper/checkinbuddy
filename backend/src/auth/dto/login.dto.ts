import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum UserRole {
  HOST = 'host',
  AGENT = 'agent',
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  firebaseToken: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
} 