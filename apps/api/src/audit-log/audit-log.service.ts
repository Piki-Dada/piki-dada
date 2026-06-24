import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  log(
    adminUserId: string,
    action: string,
    target?: { type: string; id: string },
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        adminUserId,
        action,
        targetType: target?.type,
        targetId: target?.id,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
