import { IsString, IsNotEmpty} from 'class-validator';
import type { User } from '../../user/entities/user.entity'; 

export class AuthTokensDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsString()
  @IsNotEmpty()
  tokenType: string = 'Bearer';

  @IsString()
  @IsNotEmpty()
  expiresIn: string;

  user?: User;                 // import User at top
  message?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenPayloadDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  firebaseUid: string;
} 

