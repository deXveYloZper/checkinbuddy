import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'CheckInBuddy API',
      version: '1.0.0',
    };
  }

  @Get('health/db')
  async getDbHealth() {
    // Basic database health check
    return {
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
