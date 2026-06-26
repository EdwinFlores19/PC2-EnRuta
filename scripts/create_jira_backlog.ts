/**
 * scripts/create_jira_backlog.ts — Carga Automática y Asignación de Backlog en Jira Cloud (OAuth v3)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// 1. CARGAR CREDENCIALES
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
    }
    env[key] = val;
  });
  return env;
}

const envAgents = loadEnvFile(envAgentsPath);

const JIRA_DOMAIN = envAgents.JIRA_DOMAIN || 'edwinfloress.atlassian.net';
const JIRA_EMAIL = envAgents.JIRA_EMAIL || 'ejuniorfloress@gmail.com';
const JIRA_API_TOKEN = envAgents.JIRA_API_TOKEN || '';
const JIRA_PROJECT_KEY = 'PFDC3'; // Proyecto verificado de la PC
const ASSIGNEE_ACCOUNT_ID = '615b12b4289a54006a07b729'; // ID de cuenta del usuario (Edwin Flores)

const CLOUD_ID = '4270945b-d01c-4078-b76b-1293002d605b';

// Cargar el JSON del backlog
const backlogPath = path.join(PROJECT_ROOT, 'scripts', 'epics_and_stories.json');
const backlogData = JSON.parse(fs.readFileSync(backlogPath, 'utf-8'));

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

function buildADFDescription(text: string, criteria: string[]): any {
  const paragraphs = text.split('\n').filter(Boolean).map(line => ({
    type: 'paragraph',
    content: [{ type: 'text', text: line }]
  }));

  const criteriaNodes: any[] = [];
  if (criteria && criteria.length > 0) {
    criteriaNodes.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: '✅ Criterios de Aceptación' }]
    });

    const listItems = criteria.map(crit => ({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: crit }]
      }]
    }));

    criteriaNodes.push({
      type: 'bulletList',
      content: listItems
    });
  }

  return {
    version: 1,
    type: 'doc',
    content: [...paragraphs, ...criteriaNodes]
  };
}

async function createIssue(fields: any): Promise<string> {
  const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const options: https.RequestOptions = {
    hostname: JIRA_DOMAIN,
    path: '/rest/api/3/issue',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DevSecOps-Jira-Automator'
    }
  };

  const res = await makeRequest(options, JSON.stringify({ fields }));
  if (res.statusCode === 201) {
    const data = JSON.parse(res.body);
    return data.key;
  }
  throw new Error(`Fallo al crear issue (HTTP ${res.statusCode}): ${res.body}`);
}

async function run() {
  console.log('🚀 INICIANDO CARGA AGÉNTICA DE BACKLOG EN JIRA CLOUD...');
  console.log(`👤 Asignado único: Edwin Flores Sanchez (${ASSIGNEE_ACCOUNT_ID})`);
  console.log(`📁 Proyecto de destino: ${JIRA_PROJECT_KEY}`);

  let epicsCreated = 0;
  let storiesCreated = 0;

  for (const [index, epic] of backlogData.epics.entries()) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`📦 Procesando Épica: ${epic.title}`);
    console.log(`──────────────────────────────────────────────────`);

    const sprintNumber = index + 1; // Sprints 1 a 4, la última va a backlog
    const sprintTag = sprintNumber <= 4 ? `Sprint ${sprintNumber}` : 'Backlog';

    // 1. Crear Épica en Jira (tipo 10041 para Epic en PFDC3)
    const epicFields: any = {
      project: { key: JIRA_PROJECT_KEY },
      summary: `${sprintTag ? '[' + sprintTag + '] ' : ''}${epic.title}`,
      description: buildADFDescription(epic.description, epic.acceptance_criteria),
      issuetype: { id: '10041' }, // Epic ID verificado
      assignee: { id: ASSIGNEE_ACCOUNT_ID },
      labels: [...epic.labels, sprintTag.toLowerCase().replace(' ', '-')]
    };

    try {
      const epicKey = await createIssue(epicFields);
      console.log(`✅ Épica creada: ${epicKey} [Asignado]`);
      epicsCreated++;

      // 2. Crear historias ligadas a esta Épica
      for (const story of epic.stories) {
        console.log(`  📝 Creando Historia: ${story.title} (${story.story_points} pts)...`);
        
        // Decidir tipo de issue (Historia 10044 o Tarea 10043)
        const isTask = story.title.startsWith('TASK-');
        const issueTypeId = isTask ? '10043' : '10044'; // Tarea o Historia

        const storyFields: any = {
          project: { key: JIRA_PROJECT_KEY },
          summary: `${sprintTag ? '[' + sprintTag + '] ' : ''}${story.title}`,
          description: buildADFDescription(story.description, story.acceptance_criteria),
          issuetype: { id: issueTypeId },
          parent: { key: epicKey }, // Vincular a la Épica en Next-gen
          assignee: { id: ASSIGNEE_ACCOUNT_ID },
          priority: { name: story.priority },
          labels: [...story.labels, sprintTag.toLowerCase().replace(' ', '-')]
        };

        // Story Points (Next-gen campo: customfield_10016)
        if (story.story_points) {
          storyFields.customfield_10016 = story.story_points;
        }

        const storyKey = await createIssue(storyFields);
        console.log(`     ✅ Creado: ${storyKey} [Asignado]`);
        storiesCreated++;
      }
    } catch (e: any) {
      console.error(`❌ Error procesando épica '${epic.title}': ${e.message}`);
    }
  }

  console.log('\n======================================================');
  console.log('🎉 PROCESO COMPLETADO EXITOSAMENTE');
  console.log('======================================================');
  console.log(`- Épicas creadas y asignadas: ${epicsCreated}`);
  console.log(`- Historias y Tareas creadas y asignadas: ${storiesCreated}`);
  console.log('======================================================');
}

run().catch(console.error);
