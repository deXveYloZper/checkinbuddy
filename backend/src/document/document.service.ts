import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { S3 } from 'aws-sdk';
import { Document } from './entities/document.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentService {
  private s3: S3;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private configService: ConfigService,
  ) {
    // Initialize AWS S3
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION') || 'eu-west-1',
    });
  }

  async generateUploadUrl(
    checkInRequestId: string,
    fileName: string,
    fileType: string,
    uploaderId: string
  ): Promise<{ uploadUrl: string; document: Document }> {
    // Validate file type (JPEG, PNG, PDF as per performance considerations)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
    }

    // Generate unique file key
    const timestamp = Date.now();
    const fileExtension = this.getFileExtension(fileType);
    const fileKey = `documents/${checkInRequestId}/${timestamp}-${fileName}${fileExtension}`;

    // Set expiration to 48 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Create document record
    const document = this.documentRepository.create({
      checkInRequestId,
      uploaderId,
      fileKey,
      fileName,
      fileType,
      expiresAt,
    });

    const savedDocument = await this.documentRepository.save(document);

    // Generate pre-signed URL for upload (expires in 1 hour)
    const bucketName = this.configService.get('AWS_S3_BUCKET') || 'checkinbuddy-documents';
    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
      Expires: 3600, // 1 hour
      ContentLengthRange: [0, 5 * 1024 * 1024], // Max 5MB as per performance considerations
    });

    return { uploadUrl, document: savedDocument };
  }

  async generateDownloadUrl(documentId: string): Promise<string> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Check if document has expired
    if (new Date() > document.expiresAt) {
      throw new Error('Document has expired');
    }

    // Generate pre-signed URL for download (expires in 1 hour)
    const bucketName = this.configService.get('AWS_S3_BUCKET') || 'checkinbuddy-documents';
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: document.fileKey,
      Expires: 3600, // 1 hour
    });
  }

  async getDocumentsByCheckInRequest(checkInRequestId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { checkInRequestId },
      relations: ['uploader'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from S3
    const bucketName = this.configService.get('AWS_S3_BUCKET') || 'checkinbuddy-documents';
    await this.s3.deleteObject({
      Bucket: bucketName,
      Key: document.fileKey,
    }).promise();

    // Delete from database
    await this.documentRepository.delete(documentId);
  }

  // Cron job to delete expired documents (runs hourly)
  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredDocuments(): Promise<void> {
    console.log('Running expired documents cleanup...');

    try {
      // Find expired documents
      const expiredDocuments = await this.documentRepository.find({
        where: {
          expiresAt: LessThan(new Date()),
        },
      });

      console.log(`Found ${expiredDocuments.length} expired documents to delete`);

      // Delete each expired document
      for (const document of expiredDocuments) {
        try {
          await this.deleteDocument(document.id);
          console.log(`Deleted expired document: ${document.id}`);
        } catch (error) {
          console.error(`Failed to delete document ${document.id}:`, error);
        }
      }

      console.log('Expired documents cleanup completed');
    } catch (error) {
      console.error('Error during expired documents cleanup:', error);
    }
  }

  private getFileExtension(fileType: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf',
    };
    return typeMap[fileType] || '';
  }

  async validateDocument(documentId: string, uploaderId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, uploaderId },
      relations: ['checkInRequest', 'uploader'],
    });

    if (!document) {
      throw new Error('Document not found or access denied');
    }

    return document;
  }
} 