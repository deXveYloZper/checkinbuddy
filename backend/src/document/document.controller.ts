import { Controller } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}
  
  // TODO: Implement document upload endpoints
} 