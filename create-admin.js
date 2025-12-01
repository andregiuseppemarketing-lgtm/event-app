const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@panico.app',
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      phone: '+393331234567'
    }
  });
  
  console.log('✅ Admin user created:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
