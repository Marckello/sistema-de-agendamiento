// Script para crear el Platform Admin de producción
// Ejecutar con: npx ts-node scripts/create-platform-admin.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'marco@serrano.marketing';
  const password = 'CSerrano6024502025*';
  const firstName = 'Marco';
  const lastName = 'Serrano';

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 12);

  // Eliminar cualquier admin anterior (solo debe haber uno)
  await prisma.platformAdmin.deleteMany({});

  // Crear el Platform Admin
  const admin = await prisma.platformAdmin.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
    },
  });

  console.log('✅ Platform Admin creado exitosamente:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Nombre: ${admin.firstName} ${admin.lastName}`);
  console.log(`   ID: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
