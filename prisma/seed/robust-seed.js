const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Check if demo user already exists
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@inr100.com' }
    });

    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('demo123', 12);

      demoUser = await prisma.user.create({
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
      console.log('✅ Created demo user');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    // Create wallet for demo user if it doesn't exist
    try {
      await prisma.wallet.create({
        data: {
          userId: demoUser.id,
          balance: 10000,
          currency: 'INR',
        },
      });
      console.log('✅ Created wallet for demo user');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('ℹ️  Wallet already exists for demo user');
      } else {
        console.log('❌ Error creating wallet:', error.message);
      }
    }

    // Create demo assets if they don't exist
    const assetSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'AXISBLUECHIP', 'GOLD'];
    const assets = [];

    for (const symbol of assetSymbols) {
      try {
        let asset;
        
        if (symbol === 'RELIANCE') {
          asset = await prisma.asset.create({
            data: {
              symbol: 'RELIANCE',
              name: 'Reliance Industries Ltd.',
              type: 'STOCK',
              category: 'EQUITY',
              currentPrice: 2500.50,
              change24h: 20.25,
            },
          });
        } else if (symbol === 'TCS') {
          asset = await prisma.asset.create({
            data: {
              symbol: 'TCS',
              name: 'Tata Consultancy Services Ltd.',
              type: 'STOCK',
              category: 'EQUITY',
              currentPrice: 3750.75,
              change24h: 30.25,
            },
          });
        } else if (symbol === 'HDFCBANK') {
          asset = await prisma.asset.create({
            data: {
              symbol: 'HDFCBANK',
              name: 'HDFC Bank Ltd.',
              type: 'STOCK',
              category: 'EQUITY',
              currentPrice: 1650.25,
              change24h: -25.25,
            },
          });
        } else if (symbol === 'AXISBLUECHIP') {
          asset = await prisma.asset.create({
            data: {
              symbol: 'AXISBLUECHIP',
              name: 'Axis Bluechip Fund',
              type: 'MUTUAL_FUND',
              category: 'EQUITY',
              currentPrice: 45.25,
              change24h: 0.45,
            },
          });
        } else if (symbol === 'GOLD') {
          asset = await prisma.asset.create({
            data: {
              symbol: 'GOLD',
              name: 'Digital Gold',
              type: 'COMMODITY',
              category: 'COMMODITY',
              currentPrice: 5250.00,
              change24h: 24.50,
            },
          });
        }
        
        assets.push(asset);
        console.log(`✅ Created asset: ${symbol}`);
      } catch (error) {
        if (error.code === 'P2002') {
          // Asset already exists, fetch it
          const existingAsset = await prisma.asset.findUnique({
            where: { symbol }
          });
          if (existingAsset) {
            assets.push(existingAsset);
            console.log(`ℹ️  Asset already exists: ${symbol}`);
          }
        } else {
          console.log(`❌ Error creating asset ${symbol}:`, error.message);
        }
      }
    }

    // Create demo portfolio if it doesn't exist
    try {
      const demoPortfolio = await prisma.portfolio.create({
        data: {
          userId: demoUser.id,
          name: 'My Investment Portfolio',
          description: 'Diversified portfolio across stocks, mutual funds, and gold',
          totalValue: 25000,
          riskLevel: 3,
        },
      });
      console.log('✅ Created demo portfolio');

      // Create holdings for demo portfolio
      try {
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
        console.log('✅ Created portfolio holdings');
      } catch (error) {
        console.log('❌ Error creating holdings:', error.message);
      }
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('ℹ️  Portfolio already exists for demo user');
      } else {
        console.log('❌ Error creating portfolio:', error.message);
      }
    }

    // Create sample transactions
    try {
      await Promise.all([
        prisma.transaction.create({
          data: {
            userId: demoUser.id,
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
      console.log('✅ Created sample transactions');
    } catch (error) {
      console.log('❌ Error creating transactions:', error.message);
    }

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('Demo user credentials:');
    console.log('Email: demo@inr100.com');
    console.log('Password: demo123');
    console.log('');
    console.log('🌐 Application is running at: http://localhost:3000');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });