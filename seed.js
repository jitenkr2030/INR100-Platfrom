const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  console.log('🌱 Seeding database...');
  
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@inr100.com' }
    });
    
    if (existingUser) {
      console.log('Demo user already exists, skipping...');
    } else {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      
      const demoUser = await prisma.user.create({
        data: {
          email: 'demo@inr100.com',
          phone: '+919876543210',
          password: hashedPassword,
          name: 'Demo User',
          level: 1,
          xp: 0,
          streak: 0
        }
      });
      console.log('✅ Created demo user:', demoUser.email);
    }
    
    console.log('✅ Basic seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();