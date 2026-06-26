/**
 * scripts/rename_sprints.ts — Renombrar Sprints físicos en Jira Cloud con nombres representativos (SRE)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const envAgentsPath = path.join(PROJECT_ROOT, '.env.agents');
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

const JIRA_DOMAIN = envAgents.JIRA_DOMAIN || 'edwinfloress.atlassian.net';
const JIRA_EMAIL = envAgents.JIRA_EMAIL || 'ejuniorfloress@gmail.com';
const JIRA_API_TOKEN = envAgents.JIRA_API_TOKEN || '';

const SPRINTS_TO_RENAME = [
  { id: 77, name: 'Sprint 1: KYC LegalTech' },
  { id: 115, name: 'Sprint 2: Uber Engine' },
  { id: 116, name: 'Sprint 3: AI Matcher' },
  { id: 117, name: 'Sprint 4: QA & DevOps' }
];

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

async function run() {
  const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  console.log('🚀 INICIANDO RENOMBRAMIENTO DE SPRINTS EN JIRA CLOUD...');

  for (const sprint of SPRINTS_TO_RENAME) {
    console.log(`Renombrando Sprint ID ${sprint.id} a: "${sprint.name}"...`);

    const options: https.RequestOptions = {
      hostname: JIRA_DOMAIN,
      path: `/rest/agile/1.0/sprint/${sprint.id}`,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DevSecOps-Jira-SRE'
      }
    };

    const payload = JSON.stringify({
      name: sprint.name,
      state: 'future'
    });

    try {
      const res = await makeRequest(options, payload);
      if (res.statusCode === 200) {
        console.log(`   ✅ Sprint ID ${sprint.id} renombrado con éxito!`);
      } else {
        console.error(`   ❌ Fallo al renombrar Sprint ID ${sprint.id} (HTTP ${res.statusCode}): ${res.body}`);
      }
    } catch (e: any) {
      console.error(`   ❌ Error de red: ${e.message}`);
    }
  }

  console.log('\n🎉 PROCESO DE CONFIGURACIÓN DE SPRINTS FINALIZADO CON ÉXITO!');
}

run();
