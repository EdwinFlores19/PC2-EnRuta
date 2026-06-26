#!/usr/bin/env tsx
/**
 * scripts/generate_crud.ts — Generador Autónomo de CRUD en TypeScript para Backend MVC
 * 
 * PROPÓSITO:
 *   Reemplazar el generador de PowerShell obsoleto (.js CommonJS) con un generador
 *   robusto en TypeScript que produce código 100% compatible con nuestra arquitectura.
 * 
 * USO:
 *   npx tsx scripts/generate_crud.ts <EntityName> <RoutePath>
 *   Ejemplo: npx tsx scripts/generate_crud.ts Product products
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const args = process.argv.slice(2);
const EntityName = args[0];
const RoutePath = args[1] || EntityName?.toLowerCase() + 's';

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const ok = (msg: string) => console.log(`${c.green}✅ ${msg}${c.reset}`);
const err = (msg: string) => console.log(`${c.red}❌ ${msg}${c.reset}`);

if (!EntityName) {
  err('Especifica el nombre de la entidad.');
  console.log(`Uso: npx tsx scripts/generate_crud.ts <EntityName> <RoutePath>`);
  process.exit(1);
}

const entityCamel = EntityName.substring(0, 1).toLowerCase() + EntityName.substring(1);
const entityLower = EntityName.toLowerCase();

const routeFile = path.join(PROJECT_ROOT, 'backend', 'src', 'routes', `${entityCamel}.routes.ts`);
const controllerFile = path.join(PROJECT_ROOT, 'backend', 'src', 'controllers', `${entityCamel}.controller.ts`);
const serviceFile = path.join(PROJECT_ROOT, 'backend', 'src', 'services', `${entityCamel}.service.ts`);
const repositoryFile = path.join(PROJECT_ROOT, 'backend', 'src', 'repositories', `${entityCamel}.repository.ts`);

console.log(`\n${c.bright}${c.blue}⚙️  GENERADOR DE CRUD TYPESCRIPT MVC — ENTIDAD: ${EntityName}${c.reset}\n`);

// ─────────────────────────────────────────────
// 1. ROUTE TEMPLATE
// ─────────────────────────────────────────────
const routeTemplate = `/**
 * src/routes/${entityCamel}.routes.ts — Rutas de la Entidad ${EntityName} (TypeScript)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import * as ${EntityName}Controller from '../controllers/${entityCamel}.controller.js';

const router = Router();

router.get('/', authenticate, ${EntityName}Controller.getAll);
router.get('/:id', authenticate, ${EntityName}Controller.getById);

router.post('/',
  authenticate,
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  validate,
  ${EntityName}Controller.create
);

router.patch('/:id',
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  validate,
  ${EntityName}Controller.update
);

router.delete('/:id', authenticate, ${EntityName}Controller.remove);

export default router;
`;

// ─────────────────────────────────────────────
// 2. CONTROLLER TEMPLATE
// ─────────────────────────────────────────────
const controllerTemplate = `/**
 * src/controllers/${entityCamel}.controller.ts — Controlador de ${EntityName} (TypeScript)
 */

import { Request, Response } from 'express';
import { asyncHandler, buildResponse } from '../utils/index.js';
import * as ${EntityName}Service from '../services/${entityCamel}.service.js';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await ${EntityName}Service.findAll(filters, Number(page), Number(limit));
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await ${EntityName}Service.findById(req.params.id);
  res.status(200).json(buildResponse(item));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await ${EntityName}Service.create({ ...req.body, userId: (req as any).user?.id });
  res.status(201).json(buildResponse(item, '${EntityName} creado correctamente.'));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await ${EntityName}Service.update(req.params.id, req.body);
  res.status(200).json(buildResponse(item, '${EntityName} actualizado correctamente.'));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await ${EntityName}Service.softDelete(req.params.id);
  res.status(200).json(buildResponse(null, '${EntityName} eliminado correctamente.'));
});
`;

// ─────────────────────────────────────────────
// 3. SERVICE TEMPLATE
// ─────────────────────────────────────────────
const serviceTemplate = `/**
 * src/services/${entityCamel}.service.ts — Servicio de Lógica de Negocio de ${EntityName} (TypeScript)
 */

import { NotFoundError } from '../utils/index.js';
import * as ${EntityName}Repository from '../repositories/${entityCamel}.repository.js';

export const findAll = async (filters: any, page: number, limit: number) => {
  return ${EntityName}Repository.findAll(filters, page, limit);
};

export const findById = async (id: string) => {
  const item = await ${EntityName}Repository.findById(id);
  if (!item) throw new NotFoundError('${EntityName}');
  return item;
};

export const create = async (data: any) => {
  return ${EntityName}Repository.create(data);
};

export const update = async (id: string, data: any) => {
  const item = await ${EntityName}Repository.findById(id);
  if (!item) throw new NotFoundError('${EntityName}');
  return ${EntityName}Repository.update(id, data);
};

export const softDelete = async (id: string) => {
  const item = await ${EntityName}Repository.findById(id);
  if (!item) throw new NotFoundError('${EntityName}');
  return ${EntityName}Repository.softDelete(id);
};
`;

// ─────────────────────────────────────────────
// 4. REPOSITORY TEMPLATE
// ─────────────────────────────────────────────
const repositoryTemplate = `/**
 * src/repositories/${entityCamel}.repository.ts — Repositorio de Acceso a Base de Datos con Prisma (TypeScript)
 */

import { prisma } from '../../config/database.js';
import { buildPaginatedResponse } from '../utils/response.js';

export const findAll = async (filters: any, page = 1, limit = 10) => {
  const where = { isDeleted: false, ...filters };
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    (prisma as any).${entityCamel}.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    (prisma as any).${entityCamel}.count({ where }),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};

export const findById = async (id: string) => {
  return (prisma as any).${entityCamel}.findFirst({
    where: { id, isDeleted: false },
  });
};

export const create = async (data: any) => {
  return (prisma as any).${entityCamel}.create({ data });
};

export const update = async (id: string, data: any) => {
  return (prisma as any).${entityCamel}.update({
    where: { id },
    data,
  });
};

export const softDelete = async (id: string) => {
  return (prisma as any).${entityCamel}.update({
    where: { id },
    data: { isDeleted: true },
  });
};
`;

// Escribir los archivos físicamente
fs.writeFileSync(routeFile, routeTemplate, 'utf-8');
ok(`Rutas generadas: src/routes/${entityCamel}.routes.ts`);

fs.writeFileSync(controllerFile, controllerTemplate, 'utf-8');
ok(`Controlador generado: src/controllers/${entityCamel}.controller.ts`);

fs.writeFileSync(serviceFile, serviceTemplate, 'utf-8');
ok(`Servicio generado: src/services/${entityCamel}.service.ts`);

fs.writeFileSync(repositoryFile, repositoryTemplate, 'utf-8');
ok(`Repositorio generado: src/repositories/${entityCamel}.repository.ts`);

console.log(`\n${c.cyan}📝 Próximos pasos para activar el CRUD:${c.reset}`);
console.log(`  1. Define tu modelo '${EntityName}' en /backend/prisma/schema.prisma (ej: model ${EntityName} { id String @id @default(uuid()) ... isDeleted Boolean @default(false) })`);
console.log(`  2. Regenera Prisma y aplica migración:`);
console.log(`     npx prisma generate && npx prisma migrate dev --name add_${entityCamel}`);
console.log(`  3. Registra tu router en /backend/server.ts:`);
console.log(`     import ${entityCamel}Router from './src/routes/${entityCamel}.routes.js';`);
console.log(`     app.use('/api/v1/${RoutePath}', ${entityCamel}Router);`);
console.log(`\n${c.bright}${c.green}🎉 ¡CRUD para ${EntityName} generado con éxito en TypeScript!${c.reset}\n`);
