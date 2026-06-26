import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed para el Sistema de Asignación por Proximidad y Módulos de IA...');

  // 1. Limpieza de base de datos previa (en orden inverso de llaves foráneas para evitar conflictos)
  await prisma.sUNATAuditLog.deleteMany({});
  await prisma.educationalProgress.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.identityVerification.deleteMany({});
  await prisma.formalizationProfile.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.jobOffer.deleteMany({});
  await prisma.employerProfile.deleteMany({});
  await prisma.candidateSkill.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.workerProfile.deleteMany({});
  await prisma.intersection.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({});

  const commonPassword = await bcrypt.hash('Password123!', 12);

  // 2. Crear Usuarios Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: commonPassword,
      name: 'Administrador SRE',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // 3. Crear Pedestrians (USER role)
  const pedestrian1 = await prisma.user.create({
    data: {
      email: 'usuario@test.com',
      password: commonPassword,
      name: 'Pedestrian Demo (Carlos)',
      role: 'USER',
      isActive: true,
    },
  });

  const pedestrian2 = await prisma.user.create({
    data: {
      email: 'pedestrian2@test.com',
      password: commonPassword,
      name: 'María Rodríguez (Silla de Ruedas)',
      role: 'USER',
      isActive: true,
    },
  });
  console.log(`✅ Peatones creados: ${pedestrian1.email}, ${pedestrian2.email}`);

  // 4. Crear Intersecciones
  const intersection1 = await prisma.intersection.create({
    data: {
      name: 'Av. Javier Prado con Av. Arequipa (San Isidro)',
      latitude: -12.0945,
      longitude: -77.0335,
      lightColor: 'RED',
    },
  });

  const intersection2 = await prisma.intersection.create({
    data: {
      name: 'Av. Camino Real con Av. Pezet (San Isidro)',
      latitude: -12.0980,
      longitude: -77.0370,
      lightColor: 'GREEN',
    },
  });

  const intersection3 = await prisma.intersection.create({
    data: {
      name: 'Av. Aramburú con Av. Paseo de la República (Miraflores/San Isidro)',
      latitude: -12.1005,
      longitude: -77.0250,
      lightColor: 'YELLOW',
    },
  });
  console.log(`✅ Intersecciones creadas: 3 Intersecciones pobladas (1 en semáforo ROJO)`);

  // 5. Crear Workers y sus perfiles de ubicación por proximidad
  const worker1User = await prisma.user.create({
    data: {
      email: 'worker1@test.com',
      password: commonPassword,
      name: 'Carlos Mendoza (Asistente Vial Oro)',
      role: 'WORKER',
      isActive: true,
    },
  });

  const worker1Profile = await prisma.workerProfile.create({
    data: {
      userId: worker1User.id,
      isAvailable: true,
      latitude: -12.0942,
      longitude: -77.0332,
    },
  });

  const worker2User = await prisma.user.create({
    data: {
      email: 'worker2@test.com',
      password: commonPassword,
      name: 'Luis Gómez (Asistente Vial Plata)',
      role: 'WORKER',
      isActive: true,
    },
  });

  const worker2Profile = await prisma.workerProfile.create({
    data: {
      userId: worker2User.id,
      isAvailable: true,
      latitude: -12.0978,
      longitude: -77.0368,
    },
  });
  console.log(`✅ Trabajadores y perfiles de ubicación originales creados.`);

  // ────────────────────────────────────────────────────────────────────────
  // NUEVO: SEMBRADO DE MODELOS DE RECLUTAMIENTO E IA (PERÚ)
  // ────────────────────────────────────────────────────────────────────────

  console.log('🔮 Sembrando modelos de Reclutamiento, perfiles y habilidades...');

  // 6. Crear Habilidades Maestras
  const skill1 = await prisma.skill.create({ data: { name: 'Manejo de Hidrolavadora', category: 'Operativo' } });
  const skill2 = await prisma.skill.create({ data: { name: 'Atención al Cliente', category: 'Atención al Cliente' } });
  const skill3 = await prisma.skill.create({ data: { name: 'Control de Caja Chica', category: 'Administrativo' } });
  const skill4 = await prisma.skill.create({ data: { name: 'Reparto y Delivery', category: 'Logística' } });
  const skill5 = await prisma.skill.create({ data: { name: 'Mantenimiento Vehicular', category: 'Operativo' } });
  const skill6 = await prisma.skill.create({ data: { name: 'Ventas Directas', category: 'Ventas' } });

  console.log('✅ Habilidades maestras creadas.');

  // 7. Crear Candidatos (Trabajadores buscando empleo formal)
  const candidate1User = await prisma.user.create({
    data: {
      email: 'candidato1@test.com',
      password: commonPassword,
      name: 'Carlos Lucho Pérez',
      role: 'CANDIDATE',
      isActive: true,
    },
  });

  const candidate1Profile = await prisma.candidateProfile.create({
    data: {
      userId: candidate1User.id,
      rawText: 'Hola, trabajé cobrando pasaje en la combi ruta Arequipa 3 años, sé cuadrar la caja rápido y también ayudaba a limpiar el carro al final del día. Vivo en Breña.',
      formalTitle: 'Técnico de Detallado Vehicular y Auxiliar de Caja',
      summary: 'Colaborador proactivo con 3 años de experiencia en cobro y liquidación de caja en el sector transporte. Destaca en mantenimiento, limpieza de unidades y atención ágil al cliente.',
      location: 'Breña, Lima Centro',
      experienceJson: JSON.stringify([
        {
          rawInformalText: 'Cobrando pasaje en la combi ruta Arequipa 3 años',
          formalRole: 'Asistente de Recaudación y Caja Chica',
          duration: '3 años',
          formalResponsibilities: [
            'Liquidación diaria de caja y recaudación de dinero en efectivo bajo altos flujos de concurrencia.',
            'Atención al público en paraderos autorizados asegurando el cumplimiento de rutas.',
            'Mantenimiento básico preventivo de la unidad de transporte.'
          ]
        }
      ]),
      educationJson: JSON.stringify([
        {
          institution: 'I.E. Mariano Melgar',
          degree: 'Secundaria Completa',
          year: '2020'
        }
      ])
    },
  });

  // Asociar habilidades a Carlos
  await prisma.candidateSkill.createMany({
    data: [
      { candidateProfileId: candidate1Profile.id, skillId: skill1.id },
      { candidateProfileId: candidate1Profile.id, skillId: skill3.id },
      { candidateProfileId: candidate1Profile.id, skillId: skill5.id },
    ]
  });

  const candidate2User = await prisma.user.create({
    data: {
      email: 'candidato2@test.com',
      password: commonPassword,
      name: 'Juana Rojas Tintaya',
      role: 'CANDIDATE',
      isActive: true,
    },
  });

  const candidate2Profile = await prisma.candidateProfile.create({
    data: {
      userId: candidate2User.id,
      rawText: 'Hola, vendo menú y comida en un puesto ambulante en Comas desde el 2021, yo sola cocino, cobro a la gente y compro las verduras en el mercado mayorista.',
      formalTitle: 'Asistente de Operaciones y Atención en Restaurante',
      summary: 'Emprendedora del sector gastronómico con sólidas aptitudes para la gestión de compras, control de inventario de insumos y excelente trato con comensales.',
      location: 'Comas, Lima Norte',
      experienceJson: JSON.stringify([
        {
          rawInformalText: 'Vendo menú en puesto ambulante Comas',
          formalRole: 'Administradora de Operaciones de Alimentos',
          duration: '4 años',
          formalResponsibilities: [
            'Negociación directa con proveedores y abastecimiento logístico en mercados mayoristas.',
            'Control de caja diaria, presupuestos de compras y control de márgenes de ganancia.',
            'Atención al cliente directo y gestión del área de cocina.'
          ]
        }
      ]),
      educationJson: JSON.stringify([
        {
          institution: 'CETPRO Lima Norte',
          degree: 'Auxiliar de Cocina',
          year: '2022'
        }
      ])
    },
  });

  // Asociar habilidades a Juana
  await prisma.candidateSkill.createMany({
    data: [
      { candidateProfileId: candidate2Profile.id, skillId: skill2.id },
      { candidateProfileId: candidate2Profile.id, skillId: skill3.id },
      { candidateProfileId: candidate2Profile.id, skillId: skill6.id },
    ]
  });

  console.log(`✅ Candidatos creados: ${candidate1User.name} y ${candidate2User.name}`);

  // 8. Crear Empleador (Persona que contrata)
  const employerUser = await prisma.user.create({
    data: {
      email: 'empleador@test.com',
      password: commonPassword,
      name: 'Roberto Farfán Solís',
      role: 'EMPLOYER',
      isActive: true,
    },
  });

  const employerProfile = await prisma.employerProfile.create({
    data: {
      userId: employerUser.id,
      companyName: 'Car Wash El Rápido S.A.C.',
      industry: 'Servicios Automotrices y Detallado',
    },
  });

  // Crear oferta de trabajo para el Empleador
  await prisma.jobOffer.create({
    data: {
      employerProfileId: employerProfile.id,
      title: 'Operario de Lavado y Control de Caja',
      description: 'Buscamos colaborador con ganas de aprender para el lavado de autos de alta gama, manejo de hidrolavadoras y apoyo en el cobro a clientes.',
      location: 'Breña',
      requiredSkills: JSON.stringify(['Manejo de Hidrolavadora', 'Control de Caja Chica', 'Atención al Cliente']),
      salary: 1100.00,
      isActive: true,
    }
  });

  console.log(`✅ Empleador y oferta de trabajo creados: ${employerProfile.companyName}`);

  // 9. Crear Cuentas de Administradores Gubernamentales (B2G RBAC)
  const districtAdmin = await prisma.user.create({
    data: {
      email: 'muni.miraflores@test.com',
      password: commonPassword,
      name: 'Asesor Legal - DEMUNA Miraflores',
      role: 'DISTRICT_ADMIN',
      isActive: true,
    },
  });

  const macroAdmin = await prisma.user.create({
    data: {
      email: 'sunat.fiscalizacion@test.com',
      password: commonPassword,
      name: 'Auditor Fiscal - SUNAT Central',
      role: 'MACRO_ADMIN',
      isActive: true,
    },
  });

  console.log(`✅ Admins Gubernamentales creados: ${districtAdmin.email} (DEMUNA), ${macroAdmin.email} (SUNAT)`);

  // 10. Crear Cuentas de Cursos del "EnRuta" (Capacitación y Feature Gating)
  const course1 = await prisma.course.create({
    data: {
      title: 'Gestión Financiera Básica y Ahorro',
      description: 'Aprende a controlar tus gastos hormiga, elaborar presupuestos de caja y fijar metas de ahorro efectivas para tu micro-negocio.',
      category: 'FINANCIAL',
      totalUnits: 4,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Habilitación de RUC 10 / RUC 20 para Emprendedores',
      description: 'Domina las bases de la formalización en el Perú: emisión de recibos por honorarios, boletas de venta bajo el Nuevo RUS y cumplimiento mensual.',
      category: 'TAX_LEGAL',
      totalUnits: 5,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Habilidades Blandas y Resolución de Conflictos',
      description: 'Herramientas prácticas para comunicarte de manera asertiva, gestionar quejas y resolver tensiones viales y laborales con empatía.',
      category: 'SOFT_SKILLS',
      totalUnits: 3,
    },
  });

  const course4 = await prisma.course.create({
    data: {
      title: 'Comportamiento en la Empresa e Imagen Profesional',
      description: 'Aprende las normas de ética laboral, puntualidad, trabajo en equipo y presentación personal exigidas por empresas formales.',
      category: 'CORPORATE_ETHICS',
      totalUnits: 3,
    },
  });

  console.log('✅ Cursos del EnRuta creados con éxito.');

  console.log('🎉 Seed de Asignación por Proximidad e IA completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
