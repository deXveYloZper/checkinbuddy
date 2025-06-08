import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { CheckInRequest, PaymentStatus } from '../check-in/entities/check-in-request.entity';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(CheckInRequest)
    private checkInRepository: Repository<CheckInRequest>,
  ) {
    // Initialize Stripe with secret key
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      console.warn('Stripe secret key not configured. Payment functionality will be disabled.');
    }
  }

  async createPaymentIntent(createDto: CreatePaymentIntentDto): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    // Get the check-in request to verify details
    const checkInRequest = await this.checkInRepository.findOne({
      where: { id: createDto.checkInRequestId },
      relations: ['host'],
    });

    if (!checkInRequest) {
      throw new Error('Check-in request not found');
    }

    // Create PaymentIntent with fixed fee (€20.00 as per development plan)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(checkInRequest.fee * 100), // Convert to cents
      currency: 'eur',
      metadata: {
        checkInRequestId: createDto.checkInRequestId,
        hostId: checkInRequest.hostId,
        guestName: checkInRequest.guestName,
      },
      description: `Check-in service for ${checkInRequest.guestName} at ${checkInRequest.propertyAddress}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update check-in request with payment intent ID
    await this.checkInRepository.update(createDto.checkInRequestId, {
      paymentIntentId: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const checkInRequestId = paymentIntent.metadata.checkInRequestId;
    
    if (!checkInRequestId) {
      console.error('No checkInRequestId in payment intent metadata');
      return;
    }

    // Update check-in request status to indicate payment is complete
    await this.checkInRepository.update(checkInRequestId, {
      paymentStatus: PaymentStatus.SUCCEEDED,
      // Calculate and set fees
      platformFee: Math.round(20.00 * 0.2 * 100) / 100, // 20% platform fee = €4.00
      agentPayout: Math.round(20.00 * 0.8 * 100) / 100, // 80% to agent = €16.00
    });

    console.log(`Payment succeeded for check-in request: ${checkInRequestId}`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const checkInRequestId = paymentIntent.metadata.checkInRequestId;
    
    if (!checkInRequestId) {
      console.error('No checkInRequestId in payment intent metadata');
      return;
    }

    // Update check-in request to indicate payment failed
    await this.checkInRepository.update(checkInRequestId, {
      paymentStatus: PaymentStatus.FAILED,
      cancellationReason: 'Payment failed',
    });

    console.log(`Payment failed for check-in request: ${checkInRequestId}`);
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string; amount: number; currency: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  async refundPayment(paymentIntentId: string, reason?: string): Promise<{ refundId: string; status: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
    });

    // Update the check-in request payment status to refunded
    const checkInRequest = await this.checkInRepository.findOne({
      where: { paymentIntentId },
    });

    if (checkInRequest) {
      await this.checkInRepository.update(checkInRequest.id, {
        paymentStatus: PaymentStatus.REFUNDED,
      });
    }

    return {
      refundId: refund.id,
      status: refund.status || 'unknown',
    };
  }

  // Future: Stripe Connect for agent payouts
  async createConnectAccount(agentId: string, email: string): Promise<{ accountId: string; onboardingUrl: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    // Create Stripe Connect Express account for agent
    const account = await this.stripe.accounts.create({
      type: 'express',
      email: email,
      metadata: {
        agentId: agentId,
      },
    });

    // Create account link for onboarding
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.configService.get('FRONTEND_URL')}/agent/stripe/refresh`,
      return_url: `${this.configService.get('FRONTEND_URL')}/agent/stripe/return`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }
} 