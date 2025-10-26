import { PrismaClient, ExchangeStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@mission.test' },
    update: {},
    create: {
      email: 'demo@mission.test',
      name: 'Demo Pilot',
      hashedPassword: password,
    },
  });

  const partner = await prisma.partner.upsert({
    where: { email: 'ally@mission.test' },
    update: {},
    create: {
      name: 'Mission Ally',
      email: 'ally@mission.test',
    },
  });

  await prisma.selfReport.createMany({
    data: [
      {
        userId: user.id,
        mood: 'Optimistic',
        energy: 8,
        notes: 'Ready for the next sprint.',
      },
      {
        userId: user.id,
        mood: 'Curious',
        energy: 6,
        notes: 'Need more clarity on objectives.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.exchange.upsert({
    where: { id: 'seed-exchange' },
    update: {},
    create: {
      id: 'seed-exchange',
      userId: user.id,
      partnerId: partner.id,
      title: 'Weekly insights trade',
      summary: 'Sharing weekly retrospectives and resource lists.',
      status: ExchangeStatus.ACTIVE,
    },
  });

  await prisma.reward.createMany({
    data: [
      {
        id: 'reward-1',
        name: 'Focus Friday',
        description: 'Block your calendar for deep work with leadership support.',
        cost: 150,
      },
      {
        id: 'reward-2',
        name: 'Wellness stipend',
        description: 'Claim a $50 stipend for wellness activities.',
        cost: 250,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.redemption.upsert({
    where: {
      userId_rewardId: {
        userId: user.id,
        rewardId: 'reward-1',
      },
    },
    update: {},
    create: {
      userId: user.id,
      rewardId: 'reward-1',
    },
  });

  console.log('Seed data created for user', user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
