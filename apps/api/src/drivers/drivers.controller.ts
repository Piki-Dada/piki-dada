import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DriversService } from './drivers.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UploadsService } from '../uploads/uploads.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(
    private driversService: DriversService,
    private uploadsService: UploadsService,
  ) {}

  @Roles(UserRole.DRIVER)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.driversService.getMyProfile(user.id);
  }

  @Roles(UserRole.DRIVER)
  @Post('me/vehicle')
  upsertVehicle(@CurrentUser() user: { id: string }, @Body() dto: CreateVehicleDto) {
    return this.driversService.upsertVehicle(user.id, dto);
  }

  @Roles(UserRole.DRIVER)
  @Post('me/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: { id: string },
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileUrl = await this.uploadsService.uploadBuffer(file.buffer, 'driver-documents');
    return this.driversService.addDocument(user.id, dto.type, fileUrl);
  }

  @Roles(UserRole.DRIVER)
  @Patch('me/availability')
  setAvailability(@CurrentUser() user: { id: string }, @Body() dto: UpdateAvailabilityDto) {
    return this.driversService.setAvailability(user.id, dto.isOnline);
  }

  @Roles(UserRole.DRIVER)
  @Patch('me/location')
  updateLocation(@CurrentUser() user: { id: string }, @Body() dto: UpdateLocationDto) {
    return this.driversService.updateLocation(user.id, dto.lat, dto.lng);
  }

  @Roles(UserRole.ADMIN)
  @Get('pending')
  listPending() {
    return this.driversService.listPendingApprovals();
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.driversService.setApprovalStatus(id, 'APPROVED');
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.driversService.setApprovalStatus(id, 'REJECTED');
  }
}
