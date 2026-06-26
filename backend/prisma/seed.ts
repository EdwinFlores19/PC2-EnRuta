import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email} (${admin.role})`);

  const userPassword = await bcrypt.hash('User123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'usuario@test.com' },
    update: {},
    create: {
      email: 'usuario@test.com',
      password: userPassword,
      name: 'Usuario Demo',
      role: 'USER',
      isActive: true,
    },
  });
  console.log(`✅ Usuario creado: ${user.email} (${user.role})`);

  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
