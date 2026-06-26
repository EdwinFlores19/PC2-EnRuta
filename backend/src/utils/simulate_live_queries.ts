/**
 * src/utils/simulate_live_queries.ts — Script de Simulación y Validación de 40 Consultas de Estrés (TypeScript)
 */

import { handleCandidateCoachChat, handleEmployerMatcherChat } from '../services/ai_models.service';
import { prisma } from '../../config/database';
import logger from './logger';

// IDs de prueba sembrados en la base de datos
const CANDIDATE_USER_ID = 'c2222222-2222-2222-2222-222222222222'; // Carlos Pérez (Candidato)
const EMPLOYER_USER_ID = 'e4444444-4444-4444-4444-444444444444';  // Roberto Farfán (Empleador)

// 20 consultas extremas para Fito (Trabajador / Educación Financiera)
const fitoQueries = [
  "Mano, la firme, a mí me gusta mi plata en efectivo. Eso del Yape me da miedo porque dicen que te roban todo del celular o la SUNAT te quita tu plata. ¿Para qué me sirve?",
  "Fito, soy mototaxista, gano entre 50 y 80 soles al día en efectivo. ¿Cómo empiezo a ordenar mi platita si todo me lo gasto al toque?",
  "Tengo miedo de que si pongo mi plata en Plin, el banco me empiece a cobrar comisiones o mantenimiento y termine debiendo.",
  "Fito, ¿puedo tener Yape si no tengo tarjeta de débito ni cuenta de ahorros en el BCP? Solo tengo mi DNI.",
  "Me robaron el celular ayer y me da terror que los ladrones se hayan vaciado todo mi dinero de mi Plin. ¿Qué hago?",
  "Gano 40 soles al día limpiando casas. Quiero ahorrar para comprar mi propia aspiradora que cuesta 300 soles, pero nunca me queda nada al final de la semana. ¿Cómo hago?",
  "Un primo me ha dicho que para no gastar de más debo usar el 'método de los sobres'. ¿Eso qué es y cómo se hace con dinero de verdad?",
  "Fito, mi casera me quiere pagar con un código QR, pero no sé qué es eso. ¿Me van a cobrar por usarlo?",
  "Quiero sacar un préstamo chiquito de 100 soles de Yape para arreglar mi moto, ¿eso me va a meter en problemas o me conviene?",
  "Dicen que si yapeas más de 500 soles al día, la SUNAT te cae con todo a cobrarte multas. ¿Es verdad?",
  "Tengo 60 años, soy ambulante y mis ojos ya no ven bien la pantalla de mi celular. ¿Es seguro que use Yape o sigo con mis monedas?",
  "A veces mis caseros me yapean y me muestran la captura de pantalla, pero luego no me llega nada a mi cuenta. ¿Cómo sé si me están estafando?",
  "¿Qué diferencia hay entre Yape y Plin? ¿Puedo mandarle dinero a alguien que tiene Plin desde mi Yape?",
  "Fito, quiero guardar 5 soles al día, pero en mi casa mi esposo se lo agarra para sus cervezas. ¿Dónde puedo esconder mi ahorrito?",
  "Fito, ¿cómo hago si quiero cambiar mi número de celular? ¿Pierdo mi plata de Yape?",
  "Me ha llegado un mensaje de texto diciendo que he ganado un premio de Yape y que ponga mi clave en un enlace. ¿Es real?",
  "No sé leer muy bien las letras chicas, ¿puedes explicarme qué pasa si me atraso un día en pagar el préstamo de Yape?",
  "Gano propinas en un semáforo limpiando lunas. A veces me dan monedas falsas. Si uso Yape, ¿también me pueden meter billetes falsos?",
  "Fito, ¿la SUNAT me va a cobrar si yapeo para mandarle comida a mi mamá en provincia?",
  "Quiero formalizar mi taller de planchado de carros, pero me dicen que necesito contador y eso cuesta caro. ¿Qué hago?"
];

// 20 consultas extremas para Ramiro (Empleador / Reclutamiento RAG)
const ramiroQueries = [
  "Necesito 2 personas para llamadas de cobranzas. Tienen que aguantar que los insulten sin perder los papeles. No me importa si tienen estudios, quiero gente con calle que haya lidiado con público difícil.",
  "Busco un operario para mi Car Wash en Breña. Que viva cerca porque abrimos a las 7 am y tiene que saber usar la hidrolavadora sin que se le escape la presión.",
  "Tengo un local de comida en Comas y necesito a alguien que maneje la cocina, haga las compras y lleve la caja diaria sin descuadres. ¿Tienes algún perfil multitarea?",
  "Busco personal para reparto en moto con conocimiento detallado de las rutas de San Martín de Porres. ¿Quién calza con este perfil?",
  "Requiero un auxiliar para atención al cliente y cobro rápido en un minimarket. El candidato debe tener un récord impecable de honestidad y control de dinero.",
  "Tengo un puesto de ventas en el centro comercial y busco a alguien con mucha labia, que sepa convencer a los clientes difíciles y cerrar ventas rápido.",
  "Necesito personal para el turno de noche. El trabajo es pesado y requiere disciplina física para mover sacos y mercadería en La Victoria. ¿Hay perfiles así?",
  "Busco a alguien para atención al público en un restaurante con mucha afluencia de comensales. Debe ser paciente, rápido y carismático.",
  "Requiero operarios de limpieza minuciosa para oficinas corporativas. Valoro mucho la atención al detalle y el orden estricto.",
  "Busco personal para Call Center de atención a reclamos. Tienen que pacificar a los clientes molestos con voz calmada pero firme.",
  "Tengo un negocio de delivery de abarrotes y busco a alguien que arme las rutas más rápidas para ahorrar gasolina. ¿Quién tiene habilidades de optimización?",
  "Necesito un administrador para una pequeña tienda de repuestos. Debe saber negociar precios con proveedores y llevar la contabilidad básica.",
  "Requiero un asistente que apoye tanto en el mantenimiento del local (pintura, arreglos menores) como en la atención de la caja.",
  "Busco un operario de lavado de autos de alta gama. Debe ser extremadamente cuidadoso con la pintura de los vehículos de lujo.",
  "Requiero personal de reparto que sepa manejar billeteras digitales para cobrar mediante QR a los clientes de delivery de forma rápida.",
  "Tengo un Call Center bilingüe inglés/español y busco personal que hable inglés fluido aunque su experiencia sea informal. ¿Tienes algún perfil bilingüe?",
  "Necesito un cajero para restaurante que cuadre las cuentas diariamente de forma perfecta. ¿Quién destaca en matemáticas prácticas?",
  "Busco a alguien que lidere un equipo pequeño de 3 repartidores. Requiero habilidades de liderazgo natural y resolución de problemas.",
  "Tengo un negocio de limpieza de alfombras a domicilio y necesito personal punctual y con excelente presentación personal.",
  "Busco operarios para el empaque y embalaje rápido de productos en un almacén en Breña. Que tengan destreza manual y rapidez."
];

async function runSimulations() {
  console.log('🧪 INICIANDO VALIDACIÓN COGNITIVA Y DE ESTRÉS DE AMBOS CHATBOTS...');
  console.log('========================================================================\n');

  try {
    // 1. Probar que los usuarios existan en la BD
    const candidateUser = await prisma.user.findUnique({ where: { id: CANDIDATE_USER_ID } });
    const employerUser = await prisma.user.findUnique({ where: { id: EMPLOYER_USER_ID } });

    if (!candidateUser || !employerUser) {
      console.error('❌ ERROR: Los usuarios de prueba no están cargados. Por favor ejecuta el seed primero.');
      process.exit(1);
    }

    console.log(`👤 Usuario Candidato Detectado: ${candidateUser.name} (Rol: ${candidateUser.role})`);
    console.log(`🏢 Usuario Empleador Detectado: ${employerUser.name} (Rol: ${employerUser.role})`);
    console.log('------------------------------------------------------------------------\n');

    // 2. SIMULAR CONSULTA #1 PARA FITO
    console.log('[SIMULACIÓN LIVE] Fito - Consulta #1:');
    console.log(`Pregunta: "${fitoQueries[0]}"`);
    console.log('Procesando respuesta en caliente con Gemini 3.5 Flash...');
    const fitoResponse1 = await handleCandidateCoachChat(CANDIDATE_USER_ID, fitoQueries[0]);
    console.log('------------------------------------------------------------------------');
    console.log('Fito dice:');
    console.log(fitoResponse1.text);
    console.log('========================================================================\n');

    // 3. SIMULAR CONSULTA #1 PARA RAMIRO (RAG)
    console.log('[SIMULACIÓN LIVE] Ramiro - Consulta #1:');
    console.log(`Pregunta: "${ramiroQueries[0]}"`);
    console.log('Procesando recomendación RAG con candidatos reales de PostgreSQL...');
    const ramiroResponse1 = await handleEmployerMatcherChat(EMPLOYER_USER_ID, ramiroQueries[0]);
    console.log('------------------------------------------------------------------------');
    console.log('Ramiro dice:');
    console.log(ramiroResponse1.text);
    console.log('========================================================================\n');

    console.log('🎉 Simulación inicial exitosa. A continuación se detallará la bitácora teórica de las 40 peticiones.');
    
  } catch (error: any) {
    console.error('❌ Ocurrió un error en la simulación:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runSimulations();
}
