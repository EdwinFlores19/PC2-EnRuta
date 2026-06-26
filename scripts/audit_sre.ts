/**
 * scripts/audit_sre.ts — Dry-Run de Auditoría e Diagnóstico de Confiabilidad SRE (Read-Only)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// 1. CARGAR CONFIGURACIONES
const envAgentsPath = path.join(PROJECT_ROOT, '.env.agents');
const backendEnvPath = path.join(PROJECT_ROOT, 'backend', '.env');

function loadEnvFile(filePath: string): Record<string, string> {
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

const envAgents = loadEnvFile(envAgentsPath);
const backendEnv = loadEnvFile(backendEnvPath);

const JIRA_DOMAIN = envAgents.JIRA_DOMAIN || 'edwinfloress.atlassian.net';
const JIRA_EMAIL = envAgents.JIRA_EMAIL || 'ejuniorfloress@gmail.com';
const JIRA_API_TOKEN = envAgents.JIRA_API_TOKEN || '';
const JIRA_PROJECT_KEY = 'PC2';

const VERCEL_TOKEN = envAgents.VERCEL_TOKEN || '';
const VERCEL_PROJECT_ID = envAgents.VERCEL_PROJECT_ID || 'prj_KIQpXVaEBn7UiVEjTdsebmmFrJZm';

const RENDER_API_KEY = envAgents.RENDER_API_KEY || '';
const RENDER_SERVICE_ID = envAgents.RENDER_SERVICE_ID || 'srv-d8uaurdaeets738q8sag';

const GITHUB_PAT = envAgents.GITHUB_PAT || '';
const DATABASE_URL = backendEnv.DATABASE_URL || '';

// HELPER PARA PETICIONES HTTPS (READ-ONLY)
function makeRequest(options: https.RequestOptions, postData?: string): Promise<{ statusCode?: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => { reject(err); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function auditDatabase(): Promise<{ status: string; details: string }> {
  if (!DATABASE_URL) {
    return { status: 'FAIL', details: 'DATABASE_URL no definida en backend/.env' };
  }

  if (DATABASE_URL.includes('[REF]')) {
    return { status: 'WARNING', details: 'DATABASE_URL contiene el placeholder [REF] sin reemplazar.' };
  }

  // Intentar una conexión rápida con 'pg'
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    // Timeout de 3 segundos para el handshake
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexión')), 3000));
    await Promise.race([client.connect(), timeout]);
    const res = await client.query('SELECT version();');
    await client.end();
    return { status: 'OK', details: `Conexión exitosa a PostgreSQL: ${res.rows[0].version.slice(0, 30)}` };
  } catch (e: any) {
    try { await client.end(); } catch {}
    return { status: 'FAIL', details: `Error de conexión: ${e.message}` };
  }
}

async function auditVercel(): Promise<{ status: string; details: string; url?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { status: 'FAIL', details: 'VERCEL_TOKEN o VERCEL_PROJECT_ID ausentes en .env.agents' };
  }

  const options: https.RequestOptions = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${VERCEL_PROJECT_ID}${envAgents.VERCEL_ORG_ID ? '?teamId=' + envAgents.VERCEL_ORG_ID : ''}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'User-Agent': 'DevSecOps-SRE-Auditor'
    }
  };

  try {
    const res = await makeRequest(options);
    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      return {
        status: 'OK',
        details: `Proyecto Vercel '${data.name}' encontrado y vinculado con éxito.`,
        url: data.targets?.production?.alias?.[0] ? `https://${data.targets.production.alias[0]}` : undefined
      };
    }
    return { status: 'FAIL', details: `Error de API Vercel (HTTP ${res.statusCode}): ${res.body}` };
  } catch (e: any) {
    return { status: 'FAIL', details: `Fallo de red al consultar Vercel: ${e.message}` };
  }
}

async function auditRender(): Promise<{ status: string; details: string; url?: string }> {
  if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
    return { status: 'FAIL', details: 'RENDER_API_KEY o RENDER_SERVICE_ID ausentes en .env.agents' };
  }

  const options: https.RequestOptions = {
    hostname: 'api.render.com',
    path: `/v1/services/${RENDER_SERVICE_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json',
      'User-Agent': 'DevSecOps-SRE-Auditor'
    }
  };

  try {
    const res = await makeRequest(options);
    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      return {
        status: data.suspended === 'suspended' ? 'SUSPENDED' : 'OK',
        details: `Estatus: ${data.suspended === 'suspended' ? 'Suspendido' : 'Activo (LIVE)'} | AutoDeploy: ${data.autoDeploy}`,
        url: data.serviceDetails?.url || `https://${data.name}.onrender.com`
      };
    }
    return { status: 'FAIL', details: `Error de API Render (HTTP ${res.statusCode}): ${res.body}` };
  } catch (e: any) {
    return { status: 'FAIL', details: `Fallo de red al consultar Render: ${e.message}` };
  }
}

async function auditJira(): Promise<{ status: string; details: string }> {
  if (!JIRA_API_TOKEN || !JIRA_EMAIL || !JIRA_DOMAIN) {
    return { status: 'FAIL', details: 'JIRA_API_TOKEN, EMAIL o DOMAIN ausentes en .env.agents' };
  }

  const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const options: https.RequestOptions = {
    hostname: JIRA_DOMAIN,
    path: `/rest/api/3/project/${JIRA_PROJECT_KEY}`,
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Accept': 'application/json',
      'User-Agent': 'DevSecOps-SRE-Auditor'
    }
  };

  try {
    const res = await makeRequest(options);
    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      return { status: 'OK', details: `Acceso concedido al proyecto: ${data.name} [${data.key}]` };
    }

    if (res.statusCode === 404) {
      // Fallback: listar todos los proyectos para ver si hay conexión exitosa pero con otra clave de proyecto
      const listOptions = { ...options, path: '/rest/api/3/project' };
      const listRes = await makeRequest(listOptions);
      if (listRes.statusCode === 200) {
        const projects = JSON.parse(listRes.body);
        const availableKeys = projects.map((p: any) => `${p.name} [${p.key}]`).join(', ');
        if (projects.length > 0) {
          return {
            status: 'OK',
            details: `Conectado a Jira con éxito. El proyecto 'PC2' no existe, pero tienes acceso a: ${availableKeys}. Cambia JIRA_PROJECT_KEY en tus configuraciones.`
          };
        }
        return {
          status: 'OK',
          details: 'Conectado a Jira con éxito, pero tu cuenta no contiene ningún proyecto creado.'
        };
      }
    }
    return { status: 'FAIL', details: `Error de API Jira (HTTP ${res.statusCode}): ${res.body}` };
  } catch (e: any) {
    return { status: 'FAIL', details: `Fallo de red al consultar Jira: ${e.message}` };
  }
}

async function auditGithubActions(): Promise<{ status: string; details: string }> {
  if (!GITHUB_PAT) {
    return { status: 'FAIL', details: 'GITHUB_PAT ausente en .env.agents' };
  }

  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/EdwinFlores19/PC2-Boilerplate-Puente/commits/main/check-runs`,
    method: 'GET',
    headers: {
      'Authorization': `token ${GITHUB_PAT}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DevSecOps-SRE-Auditor'
    }
  };

  try {
    const res = await makeRequest(options);
    if (res.statusCode === 200) {
      const data = JSON.parse(res.body);
      const totalRuns = data.total_count || 0;
      if (totalRuns === 0) {
        return { status: 'OK', details: 'No hay runs de GitHub Actions activos en main todavía.' };
      }
      const runs = data.check_runs || [];
      const failed = runs.filter((r: any) => r.conclusion === 'failure');
      if (failed.length > 0) {
        return { status: 'FAIL', details: `${failed.length} de ${totalRuns} jobs fallaron en el último commit.` };
      }
      return { status: 'OK', details: `Todos los ${totalRuns} checks pasaron exitosamente (Verde).` };
    }
    return { status: 'FAIL', details: `Error de API GitHub (HTTP ${res.statusCode}): ${res.body}` };
  } catch (e: any) {
    return { status: 'FAIL', details: `Fallo de red al consultar GitHub: ${e.message}` };
  }
}

async function runAudit() {
  console.log('🔍 INICIANDO DIAGNÓSTICO SRE READ-ONLY...');
  
  const dbResult = await auditDatabase();
  const vercelResult = await auditVercel();
  const renderResult = await auditRender();
  const jiraResult = await auditJira();
  const githubResult = await auditGithubActions();

  console.log('\n======================================================');
  console.log('📊 REPORTES DE CONFIABILIDAD DE INFRAESTRUCTURA (SRE)');
  console.log('======================================================');
  
  console.log(`\n### 1. Estado de Conexión DB (Supabase/PostgreSQL)`);
  console.log(`- **Estatus:** ${dbResult.status === 'OK' ? '🟢 OK' : dbResult.status === 'WARNING' ? '🟡 WARNING' : '🔴 FAIL'}`);
  console.log(`- **Detalles:** ${dbResult.details}`);

  console.log(`\n### 2. Estado de Vercel Frontend`);
  console.log(`- **Estatus:** ${vercelResult.status === 'OK' ? '🟢 OK' : '🔴 FAIL'}`);
  console.log(`- **URL:** ${vercelResult.url || 'No generada'}`);
  console.log(`- **Detalles:** ${vercelResult.details}`);

  console.log(`\n### 3. Estado de Render Backend`);
  console.log(`- **Estatus:** ${renderResult.status === 'OK' ? '🟢 OK' : renderResult.status === 'SUSPENDED' ? '🟡 SUSPENDIDO' : '🔴 FAIL'}`);
  console.log(`- **URL:** ${renderResult.url || 'No generada'}`);
  console.log(`- **Detalles:** ${renderResult.details}`);

  console.log(`\n### 4. Estado de GitHub CI/CD`);
  console.log(`- **Estatus:** ${githubResult.status === 'OK' ? '🟢 OK (Verde)' : '🔴 FAIL'}`);
  console.log(`- **Detalles:** ${githubResult.details}`);

  console.log(`\n### 5. Estado de Acceso a Jira`);
  console.log(`- **Estatus:** ${jiraResult.status === 'OK' ? '🟢 OK' : '🔴 FAIL'}`);
  console.log(`- **Detalles:** ${jiraResult.details}`);

  console.log('\n### 🚨 RECOMENDACIONES SRE DE EMERGENCIA');
  if (dbResult.status === 'WARNING' || dbResult.status === 'FAIL') {
    console.log(`- **Supabase:** Asegúrate de reemplazar el placeholder '[REF]' en \`backend/.env\` con tu Reference ID real de Supabase (que encuentras en Settings > General en el Dashboard de Supabase) para activar el acceso a base de datos de producción.`);
  }
  if (renderResult.status === 'SUSPENDED') {
    console.log(`- **Render:** El servicio backend se encuentra suspendido. Accede al Dashboard de Render y reactívalo manualmente, o realiza una petición POST de re-despliegue usando tu \`RENDER_API_KEY\` para activarlo automáticamente.`);
  }
  if (vercelResult.status === 'FAIL') {
    console.log(`- **Vercel:** Confirma que el token de Vercel en \`.env.agents\` sea válido y que tu cuenta tenga acceso al proyecto \`pc2-pfdc3\`.`);
  }
  if (jiraResult.status === 'FAIL') {
    console.log(`- **Jira:** Verifica que el token de Atlassian \`JIRA_API_TOKEN\` no haya expirado y que corresponda al correo \`${JIRA_EMAIL}\`.`);
  }
  if (dbResult.status === 'OK' && vercelResult.status === 'OK' && renderResult.status === 'OK' && githubResult.status === 'OK' && jiraResult.status === 'OK') {
    console.log(`- **Todo en orden:** El sistema goza de 100% confiabilidad de infraestructura. Todo está listo para la práctica calificada.`);
  }
}

runAudit();
