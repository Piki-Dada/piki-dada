import { PrismaClient, RideType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.pricingRule.upsert({
    where: { rideType: RideType.BODA },
    update: {},
    create: { rideType: RideType.BODA, baseFare: 1500, perKm: 500, perMinute: 50, currency: 'UGX' },
  });
  await prisma.pricingRule.upsert({
    where: { rideType: RideType.ECONOMY },
    update: {},
    create: { rideType: RideType.ECONOMY, baseFare: 3000, perKm: 900, perMinute: 100, currency: 'UGX' },
  });
  await prisma.pricingRule.upsert({
    where: { rideType: RideType.COMFORT },
    update: {},
    create: { rideType: RideType.COMFORT, baseFare: 4000, perKm: 1200, perMinute: 150, currency: 'UGX' },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', discountPercent: 10, maxUses: 500 },
  });

  console.log('Seed complete: pricing rules and welcome coupon created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
