import { Controller, Post, Get, Delete, Param, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentService } from './document.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  async generateUploadUrl(
    @Req() req: any,
    @Body() uploadDto: UploadDocumentDto,
  ) {
    const uploaderId = req.user?.id;
    if (!uploaderId) {
      throw new HttpException('User not found in token', HttpStatus.UNAUTHORIZED);
    }

    try {
      return await this.documentService.generateUploadUrl(
        uploadDto.checkInRequestId,
        uploadDto.fileName,
        uploadDto.fileType,
        uploaderId
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id/download-url')
  @UseGuards(JwtAuthGuard)
  async generateDownloadUrl(@Param('id') id: string) {
    try {
      const downloadUrl = await this.documentService.generateDownloadUrl(id);
      return { downloadUrl };
    } catch (error) {
      if (error.message === 'Document not found') {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Document has expired') {
        throw new HttpException('Document has expired', HttpStatus.GONE);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('check-in/:checkInRequestId')
  @UseGuards(JwtAuthGuard)
  async getDocumentsByCheckInRequest(@Param('checkInRequestId') checkInRequestId: string) {
    try {
      return await this.documentService.getDocumentsByCheckInRequest(checkInRequestId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteDocument(@Param('id') id: string, @Req() req: any) {
    const uploaderId = req.user?.id;
    
    try {
      // Validate that user has permission to delete this document
      await this.documentService.validateDocument(id, uploaderId);
      await this.documentService.deleteDocument(id);
      return { message: 'Document deleted successfully' };
    } catch (error) {
      if (error.message === 'Document not found or access denied') {
        throw new HttpException('Document not found or access denied', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 