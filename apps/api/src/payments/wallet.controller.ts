import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

class WithdrawDto {
  @IsNumber()
  @Min(1)
  amount: number;
}

@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('me')
  getMyWallet(@CurrentUser() user: { id: string }) {
    return this.paymentsService.getWallet(user.id);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: { id: string }, @Body() dto: WithdrawDto) {
    return this.paymentsService.withdraw(user.id, dto.amount);
  }
}
