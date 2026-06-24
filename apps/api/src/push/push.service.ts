import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private publicKey: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.publicKey = this.config.getOrThrow<string>('VAPID_PUBLIC_KEY');
    webpush.setVapidDetails(
      this.config.getOrThrow<string>('VAPID_SUBJECT'),
      this.publicKey,
      this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
    );
  }

  getPublicKey() {
    return { publicKey: this.publicKey };
  }

  subscribe(dto: PushSubscriptionDto, userId?: string) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { p256dh: dto.keys.p256dh, auth: dto.keys.auth, userId },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userId,
      },
    });
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { success: true };
  }

  async broadcast(title: string, body: string, url?: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany();
    let sentCount = 0;
    let failedCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({ title, body, url }),
          );
          sentCount += 1;
        } catch (err) {
          failedCount += 1;
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
          } else {
            this.logger.warn(`Push send failed for subscription ${sub.id}: ${String(err)}`);
          }
        }
      }),
    );

    await this.prisma.pushBroadcastLog.create({
      data: { title, body, url, sentCount, failedCount },
    });

    return { sentCount, failedCount };
  }

  listBroadcastHistory() {
    return this.prisma.pushBroadcastLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
