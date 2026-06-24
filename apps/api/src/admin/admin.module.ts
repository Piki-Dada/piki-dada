import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PushModule } from '../push/push.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PushModule, AuditLogModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
