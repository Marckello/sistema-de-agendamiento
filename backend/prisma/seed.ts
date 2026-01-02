import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear planes
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'free' },
      update: {},
      create: {
        name: 'free',
        displayName: 'Gratis',
        description: 'Perfecto para empezar',
        price: 0,
        currency: 'USD',
        interval: 'monthly',
        maxEmployees: 1,
        maxClients: 50,
        maxAppointments: 100,
        maxServices: 5,
        hasPublicBooking: false,
        hasEmailReminders: true,
        hasSmsReminders: false,
        hasWebhooks: false,
        hasReports: false,
        hasCustomBranding: false,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'starter' },
      update: {},
      create: {
        name: 'starter',
        displayName: 'Starter',
        description: 'Para negocios en crecimiento',
        price: 19.99,
        currency: 'USD',
        interval: 'monthly',
        maxEmployees: 3,
        maxClients: 500,
        maxAppointments: 500,
        maxServices: 20,
        hasPublicBooking: true,
        hasEmailReminders: true,
        hasSmsReminders: false,
        hasWebhooks: true,
        hasReports: true,
        hasCustomBranding: false,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'professional' },
      update: {},
      create: {
        name: 'professional',
        displayName: 'Profesional',
        description: 'Para equipos profesionales',
        price: 49.99,
        currency: 'USD',
        interval: 'monthly',
        maxEmployees: 10,
        maxClients: 2000,
        maxAppointments: 2000,
        maxServices: 50,
        hasPublicBooking: true,
        hasEmailReminders: true,
        hasSmsReminders: true,
        hasWebhooks: true,
        hasReports: true,
        hasCustomBranding: true,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Solución completa para grandes empresas',
        price: 99.99,
        currency: 'USD',
        interval: 'monthly',
        maxEmployees: 999,
        maxClients: 99999,
        maxAppointments: 99999,
        maxServices: 999,
        hasPublicBooking: true,
        hasEmailReminders: true,
        hasSmsReminders: true,
        hasWebhooks: true,
        hasReports: true,
        hasCustomBranding: true,
      },
    }),
  ]);

  console.log('✅ Plans created:', plans.length);

  // Crear Super Admin de la plataforma
  const hashedPassword = await bcrypt.hash('admin123456', 12);
  
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@citaspro.com' },
    update: {},
    create: {
      email: 'admin@citaspro.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  console.log('✅ Platform Admin created:', platformAdmin.email);

  // Crear tenant de demostración
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Clínica Demo',
      email: 'demo@citaspro.com',
      phone: '+52 555 123 4567',
      description: 'Clínica de demostración para pruebas',
      timezone: 'America/Mexico_City',
      currency: 'MXN',
      planId: plans[2].id, // Professional
      subscriptionStatus: 'active',
      webhookActive: false,
    },
  });

  console.log('✅ Demo tenant created:', demoTenant.slug);

  // Crear usuario Super Admin del tenant demo
  const demoAdmin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'admin@demo.citaspro.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'admin@demo.citaspro.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Demo',
      phone: '+52 555 111 2222',
      role: UserRole.SUPER_ADMIN,
      title: 'Dr.',
      specialty: 'Medicina General',
    },
  });

  // Crear empleado de ejemplo
  const demoEmployee = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoTenant.id, email: 'empleado@demo.citaspro.com' } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: 'empleado@demo.citaspro.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      phone: '+52 555 333 4444',
      role: UserRole.EMPLOYEE,
      specialty: 'Pediatría',
      color: '#10B981',
    },
  });

  console.log('✅ Demo users created');

  // Crear categorías de servicios
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: 'Consultas' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: 'Consultas',
        description: 'Consultas médicas generales',
        color: '#3B82F6',
        sortOrder: 1,
      },
    }),
    prisma.serviceCategory.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: 'Procedimientos' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: 'Procedimientos',
        description: 'Procedimientos médicos',
        color: '#EF4444',
        sortOrder: 2,
      },
    }),
  ]);

  console.log('✅ Service categories created');

  // Crear servicios
  const services = await Promise.all([
    prisma.service.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: 'Consulta General' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        categoryId: categories[0].id,
        name: 'Consulta General',
        description: 'Consulta médica general',
        duration: 30,
        price: 500,
        isPublic: true,
        color: '#3B82F6',
      },
    }),
    prisma.service.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: 'Consulta Especializada' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        categoryId: categories[0].id,
        name: 'Consulta Especializada',
        description: 'Consulta con especialista',
        duration: 45,
        price: 800,
        isPublic: true,
        color: '#8B5CF6',
      },
    }),
    prisma.service.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: 'Revisión de Resultados' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        categoryId: categories[0].id,
        name: 'Revisión de Resultados',
        description: 'Revisión de estudios y resultados',
        duration: 15,
        price: 300,
        isPublic: true,
        color: '#10B981',
      },
    }),
  ]);

  console.log('✅ Services created');

  // Asignar servicios a usuarios
  await Promise.all([
    prisma.userService.upsert({
      where: { userId_serviceId: { userId: demoAdmin.id, serviceId: services[0].id } },
      update: {},
      create: { userId: demoAdmin.id, serviceId: services[0].id },
    }),
    prisma.userService.upsert({
      where: { userId_serviceId: { userId: demoAdmin.id, serviceId: services[1].id } },
      update: {},
      create: { userId: demoAdmin.id, serviceId: services[1].id },
    }),
    prisma.userService.upsert({
      where: { userId_serviceId: { userId: demoEmployee.id, serviceId: services[0].id } },
      update: {},
      create: { userId: demoEmployee.id, serviceId: services[0].id },
    }),
    prisma.userService.upsert({
      where: { userId_serviceId: { userId: demoEmployee.id, serviceId: services[2].id } },
      update: {},
      create: { userId: demoEmployee.id, serviceId: services[2].id },
    }),
  ]);

  console.log('✅ User services assigned');

  // Crear horarios de trabajo (Lunes a Viernes 9:00 - 18:00)
  const schedules = [];
  for (let day = 1; day <= 5; day++) {
    // Horario del negocio
    schedules.push(
      prisma.workSchedule.upsert({
        where: { tenantId_userId_dayOfWeek: { tenantId: demoTenant.id, userId: demoAdmin.id, dayOfWeek: day } },
        update: {},
        create: {
          tenantId: demoTenant.id,
          userId: demoAdmin.id,
          dayOfWeek: day,
          isWorking: true,
          startTime: '09:00',
          endTime: '18:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
      })
    );
    schedules.push(
      prisma.workSchedule.upsert({
        where: { tenantId_userId_dayOfWeek: { tenantId: demoTenant.id, userId: demoEmployee.id, dayOfWeek: day } },
        update: {},
        create: {
          tenantId: demoTenant.id,
          userId: demoEmployee.id,
          dayOfWeek: day,
          isWorking: true,
          startTime: '10:00',
          endTime: '19:00',
          breakStart: '14:00',
          breakEnd: '15:00',
        },
      })
    );
  }
  await Promise.all(schedules);

  console.log('✅ Work schedules created');

  // Crear clientes de ejemplo
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: demoTenant.id, phone: '+52 555 100 0001' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+52 555 100 0001',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'male',
        source: 'referral',
        tags: ['vip', 'puntual'],
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: demoTenant.id, phone: '+52 555 100 0002' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana.garcia@email.com',
        phone: '+52 555 100 0002',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female',
        source: 'web',
      },
    }),
    prisma.client.upsert({
      where: { tenantId_phone: { tenantId: demoTenant.id, phone: '+52 555 100 0003' } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+52 555 100 0003',
        dateOfBirth: new Date('1978-11-08'),
        gender: 'male',
        source: 'phone',
      },
    }),
  ]);

  console.log('✅ Demo clients created');

  // Crear plantillas de notificación
  const notificationTemplates = [
    {
      type: 'APPOINTMENT_CREATED' as const,
      channel: 'EMAIL' as const,
      subject: 'Tu cita ha sido agendada - {{business_name}}',
      body: `Hola {{client_name}},

Tu cita ha sido agendada exitosamente.

📅 Fecha: {{date}}
🕐 Hora: {{time}}
💼 Servicio: {{service_name}}
👨‍⚕️ Atendido por: {{employee_name}}

📍 Dirección: {{business_address}}

Si necesitas cancelar o reagendar tu cita, por favor contáctanos.

¡Te esperamos!

{{business_name}}`,
    },
    {
      type: 'APPOINTMENT_REMINDER_24H' as const,
      channel: 'EMAIL' as const,
      subject: 'Recordatorio: Tu cita es mañana - {{business_name}}',
      body: `Hola {{client_name}},

Este es un recordatorio de que tienes una cita programada para mañana.

📅 Fecha: {{date}}
🕐 Hora: {{time}}
💼 Servicio: {{service_name}}
👨‍⚕️ Atendido por: {{employee_name}}

📍 Dirección: {{business_address}}

¡Te esperamos!

{{business_name}}`,
    },
    {
      type: 'APPOINTMENT_CANCELED' as const,
      channel: 'EMAIL' as const,
      subject: 'Tu cita ha sido cancelada - {{business_name}}',
      body: `Hola {{client_name}},

Tu cita ha sido cancelada.

📅 Fecha: {{date}}
🕐 Hora: {{time}}
💼 Servicio: {{service_name}}

Si deseas reagendar, por favor contáctanos o visita nuestro sitio web.

{{business_name}}`,
    },
  ];

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: {
        tenantId_type_channel: {
          tenantId: demoTenant.id,
          type: template.type,
          channel: template.channel,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        ...template,
      },
    });
  }

  console.log('✅ Notification templates created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📧 Platform Admin: admin@citaspro.com');
  console.log('📧 Tenant Admin: admin@demo.citaspro.com');
  console.log('🔑 Password: admin123456');
  console.log('🌐 Demo Tenant Slug: demo\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
