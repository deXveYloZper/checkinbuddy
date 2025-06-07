import { IsNotEmpty, IsString, IsUUID, IsIn } from 'class-validator';

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsUUID()
  checkInRequestId: string;

  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'application/pdf'])
  fileType: string;
} 