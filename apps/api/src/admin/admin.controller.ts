import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RideType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { UpsertPricingRuleDto } from './dto/upsert-pricing-rule.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { BroadcastPushDto } from './dto/broadcast-push.dto';
import { PushService } from '../push/push.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private pushService: PushService,
    private auditLog: AuditLogService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  listUsers(@Query('role') role?: UserRole) {
    return this.adminService.listUsers(role);
  }

  @Patch('users/:id/suspend')
  async suspendUser(@CurrentUser() admin: { id: string }, @Param('id') id: string) {
    const result = await this.adminService.setUserActive(id, false);
    this.auditLog.log(admin.id, 'user.suspend', { type: 'User', id });
    return result;
  }

  @Patch('users/:id/activate')
  async activateUser(@CurrentUser() admin: { id: string }, @Param('id') id: string) {
    const result = await this.adminService.setUserActive(id, true);
    this.auditLog.log(admin.id, 'user.activate', { type: 'User', id });
    return result;
  }

  @Delete('users/:id')
  async deleteUser(@CurrentUser() admin: { id: string }, @Param('id') id: string) {
    if (id === admin.id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const result = await this.adminService.deleteUser(id);
    this.auditLog.log(admin.id, 'user.delete', { type: 'User', id });
    return result;
  }

  @Patch('users/:id/promote')
  async promoteUser(@CurrentUser() admin: { id: string }, @Param('id') id: string) {
    const result = await this.adminService.promoteToAdmin(id);
    this.auditLog.log(admin.id, 'user.promote', { type: 'User', id });
    return result;
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
  async upsertPricing(
    @CurrentUser() admin: { id: string },
    @Param('rideType') rideType: RideType,
    @Body() dto: UpsertPricingRuleDto,
  ) {
    const result = await this.adminService.upsertPricingRule(
      rideType as 'ECONOMY' | 'COMFORT' | 'BODA',
      dto,
    );
    this.auditLog.log(admin.id, 'pricing.upsert', { type: 'PricingRule', id: rideType }, { ...dto });
    return result;
  }

  @Get('coupons')
  listCoupons() {
    return this.adminService.listCoupons();
  }

  @Post('coupons')
  async createCoupon(@CurrentUser() admin: { id: string }, @Body() dto: CreateCouponDto) {
    const result = await this.adminService.createCoupon(dto);
    this.auditLog.log(admin.id, 'coupon.create', { type: 'Coupon', id: result.id }, { ...dto });
    return result;
  }

  @Patch('coupons/:id/deactivate')
  async deactivateCoupon(@CurrentUser() admin: { id: string }, @Param('id') id: string) {
    const result = await this.adminService.setCouponActive(id, false);
    this.auditLog.log(admin.id, 'coupon.deactivate', { type: 'Coupon', id });
    return result;
  }

  @Post('push/broadcast')
  async broadcastPush(@CurrentUser() admin: { id: string }, @Body() dto: BroadcastPushDto) {
    const result = await this.pushService.broadcast(dto.title, dto.body, dto.url);
    this.auditLog.log(admin.id, 'push.broadcast', undefined, { ...dto });
    return result;
  }

  @Get('push/history')
  pushHistory() {
    return this.pushService.listBroadcastHistory();
  }
}
