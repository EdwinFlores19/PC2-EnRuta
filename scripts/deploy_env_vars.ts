/**
 * scripts/deploy_env_vars.ts — Script Automatizado de Despliegue de Variables de Entorno en Render
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

function loadEnv(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  });
  return env;
}

async function deployEnvVars() {
  console.log('🚀 INICIANDO ACTUALIZACIÓN PROGRAMÁTICA DE VARIABLES EN RENDER...');
  console.log('======================================================');

  const backendEnv = loadEnv(path.join(PROJECT_ROOT, 'backend', '.env'));
  const agentsEnv = loadEnv(path.join(PROJECT_ROOT, '.env.agents'));

  const RENDER_API_KEY = agentsEnv.RENDER_API_KEY;
  const RENDER_SERVICE_ID = agentsEnv.RENDER_SERVICE_ID;

  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
    console.error('❌ ERROR SRE: RENDER_API_KEY o RENDER_SERVICE_ID ausentes en .env.agents');
    process.exit(1);
  }

  const variablesToUpload = {
    GEMINI_API_KEY: backendEnv.GEMINI_API_KEY,
    GEMINI_API_VERTEX: backendEnv.GEMINI_API_VERTEX,
    GEMINI_MODEL: backendEnv.GEMINI_MODEL || 'gemini-3.5-flash',
    DATABASE_URL: backendEnv.DATABASE_URL,
    FRONTEND_URL: backendEnv.FRONTEND_URL || 'https://pc2-pfdc3.vercel.app',
    JWT_SECRET: backendEnv.JWT_SECRET || 'generar_un_secreto_seguro_aqui',
    PORT: backendEnv.PORT || '10000',
  };

  if (!variablesToUpload.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no encontrada en backend/.env');
    process.exit(1);
  }

  for (const [key, value] of Object.entries(variablesToUpload)) {
    if (!value) {
      console.warn(`⚠️ Saltando ${key} porque no tiene un valor definido.`);
      continue;
    }

    console.log(`📡 Subiendo variable ${key} a Render...`);

    const url = `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars/${key}`;
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ value }),
      });

      if (response.ok) {
        console.log(`🟢 Variable ${key} actualizada con éxito en Render.`);
      } else {
        const errorText = await response.text();
        console.error(`🔴 Error al subir ${key} (HTTP ${response.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.error(`❌ Fallo de red al subir ${key}: ${err.message}`);
    }
  }

  console.log('======================================================');
  console.log('🎉 PROCESO DE SINCRONIZACIÓN DE RENDER COMPLETO.');
  console.log('======================================================');
}

deployEnvVars();
