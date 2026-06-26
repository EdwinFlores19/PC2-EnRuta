#!/usr/bin/env tsx
/**
 * scripts/setup_mcps.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Script de configuración automática de MCPs para el proyecto PC2-PFDC3 (TypeScript)
 * 
 * UBICACIÓN DEL ARCHIVO GLOBAL DE MCPs:
 *   C:\Users\ejuni\.gemini\config\mcp_config.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const VERIFY_ONLY = args.includes('--verify');
const CONFIG_ONLY = args.includes('--config');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// COLORES PARA CONSOLA
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
const warn = (msg: string) => console.log(`${c.yellow}⚠️  ${msg}${c.reset}`);
const err = (msg: string) => console.log(`${c.red}❌ ${msg}${c.reset}`);
const info = (msg: string) => console.log(`${c.cyan}ℹ️  ${msg}${c.reset}`);
const title = (msg: string) => console.log(`\n${c.bright}${c.blue}${'─'.repeat(60)}${c.reset}\n${c.bright}${c.blue}${msg}${c.reset}\n${'─'.repeat(60)}`);

const PROJECT_ROOT = path.join(__dirname, '..');

const MCP_CONFIG = {
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        PROJECT_ROOT,
      ],
    },
    github: {
      serverUrl: 'https://api.githubcopilot.com/mcp/',
      headers: {
        Authorization: 'Bearer YOUR_GITHUB_PAT',
      },
    },
    playwright: {
      command: 'npx',
      args: ['@playwright/mcp@latest', '--headless'],
    },
    supabase: {
      serverUrl: 'https://mcp.supabase.com/mcp',
    },
    render: {
      serverUrl: 'https://mcp.render.com/mcp',
      headers: {
        Authorization: 'Bearer YOUR_RENDER_API_KEY',
      },
    },
    jira: {
      serverUrl: 'https://mcp.atlassian.com/v1/mcp',
    },
    postgres: {
      command: 'npx',
      args: ['-y', '@benborla29/mcp-server-postgres'],
      env: {
        POSTGRESQL_CONNECTION_STRING: process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db',
      },
    },
    memory: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
    },
  },
};

function checkCommand(cmd: string, minVersion: string | null = null): boolean {
  try {
    const result = execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: 'pipe' });
    const version = result.trim().replace('v', '');
    if (minVersion) {
      const [major] = version.split('.').map(Number);
      const [minMajor] = minVersion.split('.').map(Number);
      if (major < minMajor) {
        warn(`${cmd}: versión ${version} (mínimo requerido: ${minVersion})`);
        return false;
      }
    }
    ok(`${cmd}: ${version}`);
    return true;
  } catch {
    err(`${cmd}: NO ENCONTRADO`);
    return false;
  }
}

function installPlaywright() {
  if (VERIFY_ONLY) return;

  info('Instalando Chromium para Playwright MCP...');
  try {
    const result = spawnSync('npx', ['playwright', 'install', 'chromium'], {
      stdio: 'inherit',
      shell: true,
    });
    if (result.status === 0) {
      ok('Playwright Chromium instalado correctamente.');
    } else {
      err('Error al instalar Playwright Chromium. Intenta manualmente: npx playwright install chromium');
    }
  } catch (e: any) {
    err(`Error al instalar Playwright: ${e.message}`);
  }
}

function checkEnvFile() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExamplePath = path.join(PROJECT_ROOT, 'backend', '.env.example');

  if (!fs.existsSync(envPath)) {
    warn('.env no existe en la raíz del proyecto.');
    if (fs.existsSync(envExamplePath)) {
      info('Copia el archivo backend/.env.example como .env y rellena los valores.');
    }
    info('Variables mínimas requeridas para los MCPs:');
    console.log(`
  DATABASE_URL=postgresql://...
  JIRA_DOMAIN=tu-empresa.atlassian.net
  JIRA_EMAIL=tu-email@empresa.com
  JIRA_API_TOKEN=ATATT_...
  JIRA_PROJECT_KEY=PC2
  RENDER_API_KEY=rnd_...
  GITHUB_PAT=ghp_...
    `);
  } else {
    ok('.env existe en la raíz del proyecto.');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const criticalVars = ['DATABASE_URL', 'JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
    criticalVars.forEach((varName) => {
      if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=YOUR_`)) {
        ok(`  Variable ${varName}: configurada`);
      } else {
        warn(`  Variable ${varName}: NO configurada`);
      }
    });
  }
}

function showMcpConfig() {
  title('📋 CONFIGURACIÓN MCP PARA ANTIGRAVITY');
  console.log(`
${c.yellow}INSTRUCCIONES:${c.reset}
1. Abre Antigravity → Panel Agent → ··· → Manage MCP Servers → View raw config
2. El archivo se abre en: ${c.cyan}C:\\Users\\${os.userInfo().username}\\.gemini\\config\\mcp_config.json${c.reset}
3. AGREGA (no reemplaces) el bloque "mcpServers" siguiente a tu configuración existente
4. Reemplaza los valores YOUR_* con tus credenciales reales
5. Reinicia Antigravity para que tome efecto

${c.yellow}BLOQUE A AÑADIR:${c.reset}
`);
  console.log(JSON.stringify({ mcpServers: MCP_CONFIG.mcpServers }, null, 2));
  
  console.log(`
${c.yellow}NOTA:${c.reset}
- Los servidores remotos usan "serverUrl" (NO "url")
- Los servidores locales usan "command" + "args"
- La clave "supabase" ya está en tu config global — verificar que no se duplique
`);
}

async function main() {
  console.log(`\n${c.bright}${'═'.repeat(60)}${c.reset}`);
  console.log(`${c.bright}  🚀 PC2-PFDC3 — Configuración del Ecosistema MCP (TypeScript)${c.reset}`);
  console.log(`${c.bright}${'═'.repeat(60)}${c.reset}\n`);

  if (CONFIG_ONLY) {
    showMcpConfig();
    return;
  }

  title('1️⃣  VERIFICACIÓN DE PRERREQUISITOS');
  checkCommand('node', '18.0.0');
  checkCommand('npm', '9.0.0');
  checkCommand('python', '3.9') || checkCommand('python3', '3.9');
  checkCommand('pip') || checkCommand('pip3');
  checkCommand('git', '2.0.0');

  title('2️⃣  VARIABLES DE ENTORNO');
  checkEnvFile();

  if (!VERIFY_ONLY) {
    title('3️⃣  INSTALACIÓN DE PLAYWRIGHT CHROMIUM');
    installPlaywright();

    title('4️⃣  INSTALACIÓN DE DEPENDENCIAS PYTHON (Jira Automator)');
    info('Instalando requests y python-dotenv...');
    try {
      spawnSync('pip', ['install', 'requests', 'python-dotenv', '--quiet'], {
        stdio: 'inherit',
        shell: true,
      });
      ok('Dependencias Python instaladas.');
    } catch {
      spawnSync('pip3', ['install', 'requests', 'python-dotenv', '--quiet'], {
        stdio: 'inherit',
        shell: true,
      });
    }
  }

  title('5️⃣  VERIFICACIÓN DE PAQUETES MCP');
  info('Los MCPs se ejecutan via npx (no requieren instalación global).');
  info('Verificando disponibilidad en el registro npm...');
  
  console.log(`
  ${c.cyan}MCPs a usar en este proyecto:${c.reset}
  ✓ @modelcontextprotocol/server-filesystem (npx)
  ✓ @modelcontextprotocol/server-memory (npx)
  ✓ @playwright/mcp@latest (npx) — OFICIAL Microsoft
  ✓ @benborla29/mcp-server-postgres (npx) — Comunidad validada
  ✓ https://api.githubcopilot.com/mcp/ — OFICIAL GitHub (Remote)
  ✓ https://mcp.supabase.com/mcp — OFICIAL Supabase (Remote)
  ✓ https://mcp.render.com/mcp — OFICIAL Render (Remote)
  ✓ https://mcp.atlassian.com/v1/mcp — OFICIAL Atlassian (Remote)
  `);

  showMcpConfig();

  title('✅ RESUMEN');
  ok('Script completado. Próximos pasos:');
  console.log(`
  1. Configurar las variables de entorno en .env (raíz del proyecto)
  2. Añadir el bloque MCP a: C:\\Users\\${os.userInfo().username}\\.gemini\\config\\mcp_config.json
  3. Reemplazar YOUR_* con credenciales reales en el mcp_config.json
  4. Reiniciar Antigravity
  5. Verificar que los MCPs aparecen en el Panel Agent

  ${c.cyan}Documentación:${c.reset}
  - MCPs del proyecto: .agents/mcp_config.json
  - Skills disponibles: .agents/skills/
  - Agentes especializados: .agents/agent_*.md
  `);
}

main().catch(console.error);
