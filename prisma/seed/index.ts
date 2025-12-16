import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@inr100.com',
      phone: '+919876543210',
      password: hashedPassword,
      name: 'Demo User',
      kycStatus: 'VERIFIED',
      isVerified: true,
      level: 5,
      xp: 2500,
    },
  });

  // Create wallet for demo user
  await prisma.wallet.create({
    data: {
      userId: demoUser.id,
      balance: 10000,
      currency: 'INR',
    },
  });

  // Create demo assets
  const assets = await Promise.all([
    prisma.asset.create({
      data: {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd.',
        type: 'STOCK',
        category: 'EQUITY',
        currentPrice: 2500.50,
        change24h: 20.25,
      },
    }),
    prisma.asset.create({
      data: {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Ltd.',
        type: 'STOCK',
        category: 'EQUITY',
        currentPrice: 3750.75,
        change24h: 30.25,
      },
    }),
    prisma.asset.create({
      data: {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd.',
        type: 'STOCK',
        category: 'EQUITY',
        currentPrice: 1650.25,
        change24h: -25.25,
      },
    }),
    prisma.asset.create({
      data: {
        symbol: 'AXISBLUECHIP',
        name: 'Axis Bluechip Fund',
        type: 'MUTUAL_FUND',
        category: 'EQUITY',
        currentPrice: 45.25,
        change24h: 0.45,
      },
    }),
    prisma.asset.create({
      data: {
        symbol: 'GOLD',
        name: 'Digital Gold',
        type: 'GOLD',
        category: 'COMMODITY',
        currentPrice: 5250.00,
        change24h: 24.50,
      },
    }),
  ]);

  // Create demo portfolio
  const demoPortfolio = await prisma.portfolio.create({
    data: {
      userId: demoUser.id,
      name: 'My Investment Portfolio',
      description: 'Diversified portfolio across stocks, mutual funds, and gold',
      totalValue: 25000,
      riskLevel: 3,
    },
  });

  // Create holdings for demo portfolio
  await Promise.all([
    prisma.holding.create({
      data: {
        portfolioId: demoPortfolio.id,
        assetId: assets[0].id, // RELIANCE
        quantity: 5,
        avgBuyPrice: 2400,
        currentPrice: 2500.50,
        totalValue: 12502.50,
        returns: 502.50,
      },
    }),
    prisma.holding.create({
      data: {
        portfolioId: demoPortfolio.id,
        assetId: assets[3].id, // AXISBLUECHIP
        quantity: 100,
        avgBuyPrice: 42.50,
        currentPrice: 45.25,
        totalValue: 4525,
        returns: 275,
      },
    }),
    prisma.holding.create({
      data: {
        portfolioId: demoPortfolio.id,
        assetId: assets[4].id, // GOLD
        quantity: 2,
        avgBuyPrice: 5100,
        currentPrice: 5250,
        totalValue: 10500,
        returns: 300,
      },
    }),
  ]);

  // Create sample transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        walletId: (await prisma.wallet.findFirst({ where: { userId: demoUser.id } }))!.id,
        type: 'DEPOSIT',
        amount: 10000,
        currency: 'INR',
        status: 'COMPLETED',
        description: 'Initial deposit',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: demoUser.id,
        type: 'INVESTMENT',
        amount: 5000,
        currency: 'INR',
        status: 'COMPLETED',
        description: 'Investment in RELIANCE',
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('Demo user credentials:');
  console.log('Email: demo@inr100.com');
  console.log('Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });