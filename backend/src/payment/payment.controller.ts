import { Controller, Post, Get, Body, Param, Req, Headers, RawBodyRequest, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Req() req: any,
    @Body() createDto: CreatePaymentIntentDto,
  ) {
    // Verify user is a host (only hosts can create payments)
    if (req.user?.role !== 'host') {
      throw new HttpException('Only hosts can create payment intents', HttpStatus.FORBIDDEN);
    }

    try {
      return await this.paymentService.createPaymentIntent(createDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new HttpException('Missing stripe-signature header', HttpStatus.BAD_REQUEST);
    }

    try {
      if (!req.rawBody) {
        throw new HttpException('Missing request body', HttpStatus.BAD_REQUEST);
      }
      await this.paymentService.handleWebhook(signature, req.rawBody);
      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error.message);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('status/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      return await this.paymentService.getPaymentStatus(paymentIntentId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('refund/:paymentIntentId')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    // Only hosts can request refunds (for now)
    if (req.user?.role !== 'host') {
      throw new HttpException('Only hosts can request refunds', HttpStatus.FORBIDDEN);
    }

    try {
      return await this.paymentService.refundPayment(paymentIntentId, body.reason);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('connect-account')
  @UseGuards(JwtAuthGuard)
  async createConnectAccount(@Req() req: any) {
    // Only agents can create Stripe Connect accounts
    if (req.user?.role !== 'agent') {
      throw new HttpException('Only agents can create Stripe Connect accounts', HttpStatus.FORBIDDEN);
    }

    try {
      return await this.paymentService.createConnectAccount(req.user.id, req.user.email);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
} 