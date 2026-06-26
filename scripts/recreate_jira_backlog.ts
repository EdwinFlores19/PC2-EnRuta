/**
 * scripts/recreate_jira_backlog.ts — Reset completo del tablero Jira y Carga del Backlog "Semáforo Social" (OAuth v3)
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
const JIRA_PROJECT_KEY = 'PFDC3';
const ASSIGNEE_ACCOUNT_ID = '615b12b4289a54006a07b729'; // ID de cuenta del usuario (Edwin Flores)

const SPRINT_MAP: Record<number, number> = {
  1: 77,   // Sprint 1
  2: 115,  // Sprint 2
  3: 116   // Sprint 3
};

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

async function run() {
  const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  console.log('🧹 INICIANDO RESET COMPLETO DEL TABLERO JIRA...');

  // 1. Obtener todos los issues actuales de PFDC3
  const searchOptions: https.RequestOptions = {
    hostname: JIRA_DOMAIN,
    path: '/rest/api/3/search/jql',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DevSecOps-Jira-SRE'
    }
  };

  const searchBody = JSON.stringify({
    jql: `project = ${JIRA_PROJECT_KEY}`,
    maxResults: 100
  });

  const searchRes = await makeRequest(searchOptions, searchBody);
  if (searchRes.statusCode === 200) {
    const data = JSON.parse(searchRes.body);
    const issues = data.issues || [];
    console.log(`Encontrados ${issues.length} issues viejos. Eliminándolos en lote...`);

    for (const issue of issues) {
      const deleteOptions: https.RequestOptions = {
        hostname: JIRA_DOMAIN,
        path: `/rest/api/3/issue/${issue.id}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${authString}`,
          'User-Agent': 'DevSecOps-Jira-SRE'
        }
      };
      const delRes = await makeRequest(deleteOptions);
      if (delRes.statusCode === 204) {
        console.log(`   🗑️  Eliminado: ${issue.key}`);
      } else {
        console.error(`   ❌ Fallo al eliminar ${issue.key} (HTTP ${delRes.statusCode}): ${delRes.body}`);
      }
    }
  }

  console.log('\n🚀 TABLERO LIMPIO. CARGANDO NUEVO BACKLOG EN JIRA CLOUD...');
  console.log(`👤 Asignado único: Edwin Flores Sanchez (${ASSIGNEE_ACCOUNT_ID})`);
  console.log(`📁 Proyecto de destino: ${JIRA_PROJECT_KEY}`);

  for (const [index, epic] of backlogData.epics.entries()) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`📦 Procesando Épica: ${epic.title}`);
    console.log(`──────────────────────────────────────────────────`);

    const sprintNumber = index + 1; // Sprints 1 a 3
    const sprintTag = `Sprint ${sprintNumber}`;
    const sprintId = SPRINT_MAP[sprintNumber];

    // 1. Crear Épica en Jira (tipo 10041 para Epic en PFDC3)
    const epicFields: any = {
      project: { key: JIRA_PROJECT_KEY },
      summary: `[${sprintTag}] ${epic.title}`,
      description: buildADFDescription(epic.description, epic.acceptance_criteria),
      issuetype: { id: '10041' }, // Epic ID verificado
      assignee: { id: ASSIGNEE_ACCOUNT_ID },
      labels: [...epic.labels, `sprint-${sprintNumber}`]
    };

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

    const epicRes = await makeRequest(options, JSON.stringify({ fields: epicFields }));
    if (epicRes.statusCode !== 201) {
      console.error(`❌ Fallo al crear épica '${epic.title}' (HTTP ${epicRes.statusCode}): ${epicRes.body}`);
      continue;
    }

    const epicDataCreated = JSON.parse(epicRes.body);
    const epicKey = epicDataCreated.key;
    console.log(`✅ Épica creada: ${epicKey} [Asignado]`);

    // Guardar las claves de historias creadas para moverlas al sprint físico en lote
    const storyKeys: string[] = [];

    // 2. Crear historias ligadas a esta Épica
    for (const story of epic.stories) {
      console.log(`  📝 Creando Historia: ${story.title} (${story.story_points} pts)...`);
      
      const isTask = story.title.startsWith('TASK-');
      const issueTypeId = isTask ? '10043' : '10044'; // Tarea (10043) o Historia (10044)

      const storyFields: any = {
        project: { key: JIRA_PROJECT_KEY },
        summary: `[${sprintTag}] ${story.title}`,
        description: buildADFDescription(story.description, story.acceptance_criteria),
        issuetype: { id: issueTypeId },
        parent: { key: epicKey }, // Vincular a la Épica en Next-gen
        assignee: { id: ASSIGNEE_ACCOUNT_ID },
        priority: { name: story.priority },
        labels: [...story.labels, `sprint-${sprintNumber}`]
      };

      // Story Points (Next-gen campo: customfield_10016)
      if (story.story_points) {
        storyFields.customfield_10016 = story.story_points;
      }

      const storyRes = await makeRequest(options, JSON.stringify({ fields: storyFields }));
      if (storyRes.statusCode === 201) {
        const storyDataCreated = JSON.parse(storyRes.body);
        const storyKey = storyDataCreated.key;
        console.log(`     ✅ Creado: ${storyKey} [Asignado]`);
        storyKeys.push(storyKey);
      } else {
        console.error(`     ❌ Fallo al crear story '${story.title}' (HTTP ${storyRes.statusCode}): ${storyRes.body}`);
      }
    }

    // 3. Mover historias de esta épica a su Sprint Físico correspondiente
    if (storyKeys.length > 0 && sprintId) {
      console.log(`  Moviendo ${storyKeys.length} actividades al Sprint Físico ID: ${sprintId} (${sprintTag})...`);
      const moveOptions: https.RequestOptions = {
        hostname: JIRA_DOMAIN,
        path: `/rest/agile/1.0/sprint/${sprintId}/issue`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'DevSecOps-Jira-SRE'
        }
      };

      const moveRes = await makeRequest(moveOptions, JSON.stringify({ issues: storyKeys }));
      if (moveRes.statusCode === 204 || moveRes.statusCode === 200) {
        console.log(`     ✅ Sincronizadas exitosamente en el Sprint Físico ${sprintId}!`);
      } else {
        console.error(`     ❌ Fallo al asociar al Sprint ${sprintId} (HTTP ${moveRes.statusCode}): ${moveRes.body}`);
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 PROCESO DE RESET Y CARGA COMPLETADO CON ÉXITO');
  console.log('======================================================');
}

run().catch(console.error);
