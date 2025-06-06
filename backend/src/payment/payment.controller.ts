import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}
  
  // TODO: Implement payment endpoints
} 