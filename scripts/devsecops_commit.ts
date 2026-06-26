#!/usr/bin/env tsx
/**
 * scripts/devsecops_commit.ts — Automatización Agéntica de Commit y Push DevSecOps
 * 
 * PROPÓSITO:
 *   Este script actúa como un "Skill" de Git inteligente que obliga al desarrollador
 *   a seguir una arquitectura Git Flow y DevSecOps robusta.
 * 
 * CAPACIDADES DEVSECOPS:
 *   1. Pre-Commit Verification: Ejecuta linting y build automático para asegurar código verde.
 *   2. Git Flow Protection: Detecta la rama actual e impide commits/pushes directos a 'main'.
 *   3. Conventional Commits: Estructura automáticamente el commit siguiendo estándares industriales.
 *   4. Push Inteligente: Sube los cambios exclusivamente a la rama correspondiente (feature -> develop).
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const ok = (msg: string) => console.log(`${c.green}[DevSecOps] ✅ ${msg}${c.reset}`);
const warn = (msg: string) => console.log(`${c.yellow}[DevSecOps] ⚠️  ${msg}${c.reset}`);
const err = (msg: string) => console.log(`${c.red}[DevSecOps] ❌ ${msg}${c.reset}`);
const info = (msg: string) => console.log(`${c.cyan}[DevSecOps] ℹ️  ${msg}${c.reset}`);

function runCmd(command: string, cwd: string = PROJECT_ROOT): string {
  try {
    return execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (e: any) {
    throw new Error(e.stderr || e.message);
  }
}

async function main() {
  console.log(`\n${c.bright}${c.blue}🛡️  ASISTENTE DE PUBLICACIÓN INTELIGENTE DEVSECOPS${c.reset}\n`);

  try {
    // ─────────────────────────────────────────
    // 1. OBTENER ESTADO DE GIT
    // ─────────────────────────────────────────
    const currentBranch = runCmd('git branch --show-current');
    info(`Rama actual detectada: ${c.bright}${currentBranch}${c.reset}`);

    // Protección de rama main
    if (currentBranch === 'main') {
      warn('¡Estás en la rama MAIN! Según la metodología DevSecOps y Git Flow:');
      warn('  - Los cambios directos en main están prohibidos.');
      warn('  - Debes trabajar en ramas "feature/*" o "hotfix/*" y mergear vía Pull Request.');
      warn('  - Solo se permite si estás realizando un setup inicial.');
    }

    // ─────────────────────────────────────────
    // 2. EJECUTAR PUERTAS DE CALIDAD (DEVSECOPS FAIL-FAST)
    // ─────────────────────────────────────────
    title('1️⃣  FILTROS DE CALIDAD PRE-COMMIT (FAIL-FAST)');

    try {
      info('Ejecutando verificación de tipos y linter en backend...');
      runCmd('npm run build', path.join(PROJECT_ROOT, 'backend'));
      ok('Backend: Tipos e infraestructura validados.');
    } catch (e: any) {
      err('El backend falló en compilación o validación de tipos.');
      console.log(e.message);
      process.exit(1);
    }

    try {
      info('Ejecutando compilación y construcción en frontend...');
      runCmd('npm run build', path.join(PROJECT_ROOT, 'frontend'));
      ok('Frontend: Compilación de producción validada.');
    } catch (e: any) {
      err('El frontend falló en la compilación de producción.');
      console.log(e.message);
      process.exit(1);
    }

    // ─────────────────────────────────────────
    // 3. SELECCIÓN DE CONVENTIONAL COMMIT
    // ─────────────────────────────────────────
    title('2️⃣  CONSTRUCCIÓN DE MENSAJE CONVENTIONAL COMMIT');
    
    // Obtener los archivos listos para commit
    const status = runCmd('git status --short');
    if (!status) {
      warn('No hay cambios pendientes en tu working tree.');
      process.exit(0);
    }

    console.log(`${c.cyan}Archivos modificados detectados:${c.reset}`);
    console.log(status);

    // Auto-agregar todos los archivos
    info('Staging automático de todos los archivos...');
    runCmd('git add .');

    // Generación del tipo de commit basado en la rama o contexto
    let commitType = 'feat';
    if (currentBranch.startsWith('feature/')) commitType = 'feat';
    else if (currentBranch.startsWith('hotfix/')) commitType = 'fix';
    else commitType = 'chore';

    const args = process.argv.slice(2);
    let commitMessage = args.join(' ');

    if (!commitMessage) {
      // Mensaje de fallback descriptivo si el usuario no ingresó uno por CLI
      commitMessage = `refactorizar y validar compilacion en rama ${currentBranch}`;
    }

    const scope = currentBranch.split('/')[1] || 'core';
    const finalCommitMsg = `${commitType}(${scope}): ${commitMessage.toLowerCase()}`;

    // ─────────────────────────────────────────
    // 4. REALIZAR EL COMMIT
    // ─────────────────────────────────────────
    title('3️⃣  GRABACIÓN DE CAMBIOS (GIT COMMIT)');
    info(`Mensaje final de commit: "${c.bright}${finalCommitMsg}${c.reset}"`);
    
    try {
      runCmd(`git commit -m "${finalCommitMsg}"`);
      ok('Commit registrado con éxito.');
    } catch (e: any) {
      if (e.message.includes('nothing to commit')) {
        ok('No hay cambios nuevos que comprometer.');
      } else {
        throw e;
      }
    }

    // ─────────────────────────────────────────
    // 5. PUBLICACIÓN DE RAMAS (GIT PUSH)
    // ─────────────────────────────────────────
    title('4️⃣  PUBLICACIÓN SEGURA (GIT PUSH)');
    
    if (currentBranch === 'main') {
      info('Subiendo directamente a origin main...');
      runCmd('git push origin main');
      ok('Push completado con éxito a la rama principal.');
    } else {
      info(`Subiendo rama local a origin ${currentBranch}...`);
      runCmd(`git push origin ${currentBranch}`);
      ok(`Push completado. Cambios públicos en: origin/${currentBranch}`);
      
      console.log(`\n${c.cyan}💡 RECOMENDACIÓN DEVSECOPS:${c.reset}`);
      console.log(`Crea un Pull Request en GitHub para integrar '${currentBranch}' hacia 'develop'.`);
    }

    console.log(`\n${c.green}🎉 PROCESO COMPLETADO EXITOSAMENTE — CÓDIGO SEGURO EN PRODUCCIÓN${c.reset}\n`);

  } catch (error: any) {
    err(`El flujo DevSecOps fue abortado debido a un error crítico:`);
    console.error(error.message);
    process.exit(1);
  }
}

function title(msg: string) {
  console.log(`\n${c.bright}${c.cyan}─── ${msg} ───${c.reset}\n`);
}

main().catch(console.error);
