import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RideType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpsertPricingRuleDto } from './dto/upsert-pricing-rule.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query('role') role?: UserRole) {
    return this.adminService.listUsers(role);
  }

  @Patch('users/:id/suspend')
  suspendUser(@Param('id') id: string) {
    return this.adminService.setUserActive(id, false);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminService.setUserActive(id, true);
  }

  @Get('trips')
  listTrips() {
    return this.adminService.listTrips();
  }

  @Get('pricing')
  listPricing() {
    return this.adminService.listPricingRules();
  }

  @Patch('pricing/:rideType')
  upsertPricing(@Param('rideType') rideType: RideType, @Body() dto: UpsertPricingRuleDto) {
    return this.adminService.upsertPricingRule(rideType as 'ECONOMY' | 'COMFORT' | 'BODA', dto);
  }

  @Get('coupons')
  listCoupons() {
    return this.adminService.listCoupons();
  }

  @Post('coupons')
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.adminService.createCoupon(dto);
  }

  @Patch('coupons/:id/deactivate')
  deactivateCoupon(@Param('id') id: string) {
    return this.adminService.setCouponActive(id, false);
  }
}
