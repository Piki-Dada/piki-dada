import { PrismaClient, RideType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // ADMIN accounts can't be self-registered through the public API (by design — see
  // RegisterDto), so the only way to bootstrap the first admin is here, via env vars.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash,
        name: 'Admin',
        role: UserRole.ADMIN,
        emailVerifiedAt: new Date(),
        wallet: { create: { balance: 0 } },
      },
    });
    console.log(`Seed: admin account ensured for ${adminEmail}.`);
  } else {
    console.log('Seed: SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set, skipping admin bootstrap.');
  }

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
