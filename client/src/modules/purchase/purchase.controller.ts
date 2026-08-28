import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from '../user/guards/auth.guard';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPurchase(@Body() purchaseData: { courseId: number }, @Req() req) {
    return this.purchaseService.createPurchase(req.user.id, purchaseData.courseId);
  }
}
