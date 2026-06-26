#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/jira_automator.py
──────────────────────────────────────────────────────────────────────────────
AUTOMATIZADOR SCRUM PARA JIRA — Creación masiva de Épicas e Historias de Usuario
──────────────────────────────────────────────────────────────────────────────

DESCRIPCIÓN:
    Lee el archivo `epics_and_stories.json` (que contiene épicas e historias
    de usuario con formato Scrum) y las crea automáticamente en Jira usando
    la Jira Cloud REST API v3.

PRERREQUISITOS:
    pip install requests python-dotenv

VARIABLES DE ENTORNO (en .env del proyecto raíz o /scripts/.env):
    JIRA_DOMAIN     → tu-empresa.atlassian.net
    JIRA_EMAIL      → tu-email@empresa.com
    JIRA_API_TOKEN  → Token generado en https://id.atlassian.com/manage-profile/security/api-tokens
    JIRA_PROJECT_KEY → Clave del proyecto (ej: PC2, PFDC, PROJ)

EJECUCIÓN:
    python jira_automator.py
    python jira_automator.py --dry-run    # Simular sin crear nada en Jira
    python jira_automator.py --epic "E-1" # Crear solo stories de una épica específica

DOCUMENTACIÓN API:
    https://developer.atlassian.com/cloud/jira/platform/rest/v3/
──────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import json
import time
import argparse
import logging
from pathlib import Path
from typing import Optional

import requests
from requests.auth import HTTPBasicAuth

# ─────────────────────────────────────────────
# CONFIGURACIÓN INICIAL
# ─────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    # Cargar .env desde el directorio raíz del proyecto (un nivel arriba de /scripts)
    env_path = Path(__file__).parent.parent / '.env'
    if not env_path.exists():
        env_path = Path(__file__).parent / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    print("⚠️  python-dotenv no instalado. Usando solo variables de entorno del sistema.")

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(Path(__file__).parent / 'jira_automator.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# CLASE PRINCIPAL: CLIENTE DE JIRA
# ─────────────────────────────────────────────
class JiraClient:
    """
    Cliente de la Jira Cloud REST API v3.
    
    Maneja autenticación, rate limiting, reintentos y creación de issues.
    """

    def __init__(self, domain: str, email: str, api_token: str, project_key: str):
        if not all([domain, email, api_token, project_key]):
            raise ValueError(
                "❌ Faltan credenciales de Jira. Verifica las variables de entorno:\n"
                "   JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY"
            )

        self.base_url = f"https://{domain.rstrip('/')}/rest/api/3"
        self.auth = HTTPBasicAuth(email, api_token)
        self.project_key = project_key
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.headers.update(self.headers)
        
        # Rate limiting: respetar límites de Jira Cloud (max ~100 req/min)
        self.request_delay = 0.7  # segundos entre peticiones
        self.max_retries = 3
        self.retry_delay = 5  # segundos entre reintentos

        logger.info(f"✅ Cliente Jira inicializado para el dominio: {domain}")
        logger.info(f"📁 Proyecto: {project_key}")

    def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Optional[dict] = None,
        retry_count: int = 0
    ) -> dict:
        """
        Realiza una petición HTTP a la API de Jira con manejo de errores y reintentos.
        
        Args:
            method: 'GET', 'POST', 'PUT', 'DELETE'
            endpoint: Ruta del endpoint (ej: '/issue')
            payload: Cuerpo JSON de la petición
            retry_count: Contador interno de reintentos
            
        Returns:
            Respuesta JSON parseada como dict
        """
        url = f"{self.base_url}{endpoint}"

        try:
            time.sleep(self.request_delay)  # Rate limiting preventivo
            
            response = self.session.request(
                method=method,
                url=url,
                json=payload,
                timeout=30
            )

            # Manejo de Rate Limiting (429 Too Many Requests)
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', self.retry_delay))
                logger.warning(f"⏳ Rate limit alcanzado. Esperando {retry_after}s...")
                time.sleep(retry_after)
                if retry_count < self.max_retries:
                    return self._make_request(method, endpoint, payload, retry_count + 1)

            # Manejo de errores del servidor (5xx) con reintento
            if response.status_code >= 500 and retry_count < self.max_retries:
                logger.warning(
                    f"⚠️  Error {response.status_code} del servidor. "
                    f"Reintento {retry_count + 1}/{self.max_retries}..."
                )
                time.sleep(self.retry_delay * (retry_count + 1))  # Backoff exponencial
                return self._make_request(method, endpoint, payload, retry_count + 1)

            response.raise_for_status()

            # Algunas respuestas (ej: 204 No Content) no tienen body
            if response.status_code == 204 or not response.content:
                return {}

            return response.json()

        except requests.exceptions.ConnectionError:
            logger.error("❌ Error de conexión. Verifica tu conexión a Internet y el JIRA_DOMAIN.")
            raise
        except requests.exceptions.Timeout:
            logger.error("❌ Timeout al conectar con Jira. Verifica tu conexión.")
            raise
        except requests.exceptions.HTTPError as e:
            error_body = {}
            try:
                error_body = e.response.json()
            except Exception:
                pass
            logger.error(
                f"❌ Error HTTP {e.response.status_code}: {e.response.url}\n"
                f"   Mensaje: {error_body.get('errorMessages', [e.response.text])}\n"
                f"   Errores: {json.dumps(error_body.get('errors', {}), indent=2, ensure_ascii=False)}"
            )
            raise

    def verify_connection(self) -> bool:
        """Verifica que las credenciales sean válidas y el proyecto exista."""
        try:
            # Verificar credenciales
            user_data = self._make_request('GET', '/myself')
            logger.info(f"👤 Autenticado como: {user_data.get('displayName')} ({user_data.get('emailAddress')})")
            
            # Verificar que el proyecto existe
            project_data = self._make_request('GET', f'/project/{self.project_key}')
            logger.info(f"📋 Proyecto verificado: {project_data.get('name')} [{self.project_key}]")
            return True
        except Exception as e:
            logger.error(f"❌ Fallo en verificación de conexión: {e}")
            return False

    def get_issue_types(self) -> dict:
        """
        Obtiene los tipos de issue disponibles en el proyecto.
        Los nombres de tipos varían entre proyectos (ej: 'Epic', 'Story', 'Historia').
        """
        data = self._make_request('GET', f'/project/{self.project_key}')
        issue_types = {it['name']: it['id'] for it in data.get('issueTypes', [])}
        logger.info(f"📌 Tipos de issue disponibles: {list(issue_types.keys())}")
        return issue_types

    def _build_adf_description(self, description_text: str, acceptance_criteria: list) -> dict:
        """
        Construye el cuerpo de la descripción en formato ADF (Atlassian Document Format).
        
        Jira Cloud API v3 requiere ADF en lugar de Markdown o texto plano.
        
        ADF es un formato JSON estructurado. Documentación:
        https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/
        
        Args:
            description_text: Texto de la descripción principal (la historia de usuario)
            acceptance_criteria: Lista de strings con los criterios de aceptación
            
        Returns:
            Documento ADF válido como dict
        """
        # Párrafos de la descripción
        description_nodes = []
        
        # Dividir el texto de descripción en párrafos (Como... / Quiero... / Para...)
        for line in description_text.split('\n'):
            line = line.strip()
            if line:
                description_nodes.append({
                    "type": "paragraph",
                    "content": [{"type": "text", "text": line}]
                })

        # Sección de Criterios de Aceptación
        criteria_nodes = []
        if acceptance_criteria:
            # Título de la sección
            criteria_nodes.append({
                "type": "heading",
                "attrs": {"level": 3},
                "content": [{"type": "text", "text": "✅ Criterios de Aceptación"}]
            })
            
            # Lista de criterios como bullet list de Jira
            list_items = []
            for criterion in acceptance_criteria:
                list_items.append({
                    "type": "listItem",
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": str(criterion)}]
                    }]
                })
            
            criteria_nodes.append({
                "type": "bulletList",
                "content": list_items
            })

        return {
            "version": 1,
            "type": "doc",
            "content": description_nodes + criteria_nodes
        }

    def create_epic(self, epic_data: dict, dry_run: bool = False) -> Optional[str]:
        """
        Crea una Épica en Jira.
        
        Args:
            epic_data: Dict con los datos de la épica desde epics_and_stories.json
            dry_run: Si True, simula sin crear nada
            
        Returns:
            La clave del issue creado (ej: 'PC2-1') o None si dry_run
        """
        title = epic_data.get('title', 'Épica sin título')
        description_text = epic_data.get('description', '')
        acceptance_criteria = epic_data.get('acceptance_criteria', [])
        story_points = epic_data.get('story_points', 0)

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": title,
                "description": self._build_adf_description(description_text, acceptance_criteria),
                "issuetype": {"name": "Epic"},
                # Campo personalizado para Epic Name (requerido en proyectos clásicos de Jira)
                # "customfield_10011": title,  # Epic Name — descomentar si da error
                "story_points": story_points,  # Puede variar según la configuración del proyecto
            }
        }

        # Añadir story points si están configurados (el campo varía por instancia de Jira)
        # Campo más común en Jira Cloud Next-gen: "customfield_10016"
        # Campo en proyectos clásicos: "story_points" o "customfield_10028"
        if story_points:
            payload["fields"]["customfield_10016"] = story_points  # Story Points (Next-gen)

        logger.info(f"  📌 {'[DRY-RUN] ' if dry_run else ''}Creando Épica: '{title}'...")

        if dry_run:
            logger.info(f"     ↳ [DRY-RUN] Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
            return f"DRY-RUN-EPIC-{epic_data.get('id', 'X')}"

        try:
            response = self._make_request('POST', '/issue', payload)
            issue_key = response.get('key')
            issue_url = f"https://{self.base_url.split('/')[2]}/browse/{issue_key}"
            logger.info(f"     ✅ Épica creada: {issue_key} → {issue_url}")
            return issue_key
        except Exception as e:
            logger.error(f"     ❌ Error al crear épica '{title}': {e}")
            return None

    def create_story(
        self,
        story_data: dict,
        epic_key: Optional[str] = None,
        dry_run: bool = False
    ) -> Optional[str]:
        """
        Crea una Historia de Usuario (Story) en Jira, opcionalmente vinculada a una Épica.
        
        Args:
            story_data: Dict con los datos de la historia desde epics_and_stories.json
            epic_key: Clave de la épica padre (ej: 'PC2-1')
            dry_run: Si True, simula sin crear nada
            
        Returns:
            La clave del issue creado (ej: 'PC2-5') o None si dry_run
        """
        title = story_data.get('title', 'Historia sin título')
        description_text = story_data.get('description', '')
        acceptance_criteria = story_data.get('acceptance_criteria', [])
        story_points = story_data.get('story_points', 1)
        priority = story_data.get('priority', 'Medium')
        labels = story_data.get('labels', [])

        payload = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": title,
                "description": self._build_adf_description(description_text, acceptance_criteria),
                "issuetype": {"name": "Story"},
                "priority": {"name": priority},
                "labels": labels,
            }
        }

        # Vincular a la épica padre
        if epic_key:
            # En proyectos Next-gen de Jira Cloud, se usa 'customfield_10014' (Epic Link)
            payload["fields"]["customfield_10014"] = epic_key
            # Alternativa para proyectos clásicos (Parent Link):
            # payload["fields"]["parent"] = {"key": epic_key}

        # Story Points
        if story_points:
            payload["fields"]["customfield_10016"] = story_points

        logger.info(f"    📝 {'[DRY-RUN] ' if dry_run else ''}Creando Story: '{title}' ({story_points} pts)...")

        if dry_run:
            logger.info(f"       ↳ [DRY-RUN] Epic padre: {epic_key}")
            return f"DRY-RUN-STORY"

        try:
            response = self._make_request('POST', '/issue', payload)
            issue_key = response.get('key')
            issue_url = f"https://{self.base_url.split('/')[2]}/browse/{issue_key}"
            logger.info(f"       ✅ Story creada: {issue_key} → {issue_url}")
            return issue_key
        except Exception as e:
            logger.error(f"       ❌ Error al crear story '{title}': {e}")
            return None


# ─────────────────────────────────────────────
# FUNCIÓN PRINCIPAL
# ─────────────────────────────────────────────
def main():
    # ─── Argumentos de línea de comandos ───
    parser = argparse.ArgumentParser(
        description='Automatizador Scrum: Crea Épicas e Historias en Jira desde un JSON'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simular la ejecución sin crear nada en Jira (útil para validar el JSON)'
    )
    parser.add_argument(
        '--epic',
        type=str,
        default=None,
        help='ID de la épica (del JSON) para procesar solo sus stories (ej: --epic E-1)'
    )
    parser.add_argument(
        '--json-file',
        type=str,
        default=None,
        help='Ruta al archivo JSON de épicas e historias (por defecto: epics_and_stories.json)'
    )
    args = parser.parse_args()

    logger.info("=" * 70)
    logger.info("🚀 AUTOMATIZADOR JIRA — Iniciando proceso")
    if args.dry_run:
        logger.info("   🧪 MODO DRY-RUN ACTIVADO — No se creará nada en Jira")
    logger.info("=" * 70)

    # ─── Leer variables de entorno ───
    JIRA_DOMAIN = os.getenv('JIRA_DOMAIN')
    JIRA_EMAIL = os.getenv('JIRA_EMAIL')
    JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
    JIRA_PROJECT_KEY = os.getenv('JIRA_PROJECT_KEY')

    missing_vars = [
        name for name, val in {
            'JIRA_DOMAIN': JIRA_DOMAIN,
            'JIRA_EMAIL': JIRA_EMAIL,
            'JIRA_API_TOKEN': JIRA_API_TOKEN,
            'JIRA_PROJECT_KEY': JIRA_PROJECT_KEY,
        }.items() if not val
    ]

    if missing_vars:
        logger.error(
            f"❌ Variables de entorno faltantes: {', '.join(missing_vars)}\n"
            f"   Crea un archivo .env en la raíz del proyecto con estas variables.\n"
            f"   Referencia: .env.example"
        )
        sys.exit(1)

    # ─── Leer archivo JSON ───
    json_file_path = Path(args.json_file) if args.json_file else Path(__file__).parent / 'epics_and_stories.json'

    if not json_file_path.exists():
        logger.error(f"❌ Archivo JSON no encontrado en: {json_file_path}")
        sys.exit(1)

    with open(json_file_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"❌ El archivo JSON tiene un error de sintaxis: {e}")
            sys.exit(1)

    epics = data.get('epics', [])
    logger.info(f"📂 Archivo cargado: {json_file_path}")
    logger.info(f"📊 Total de épicas encontradas: {len(epics)}")
    logger.info(f"📊 Total de stories encontradas: {sum(len(e.get('stories', [])) for e in epics)}")

    # ─── Inicializar cliente Jira ───
    client = JiraClient(
        domain=JIRA_DOMAIN,
        email=JIRA_EMAIL,
        api_token=JIRA_API_TOKEN,
        project_key=JIRA_PROJECT_KEY,
    )

    # Verificar conexión antes de empezar
    if not args.dry_run:
        if not client.verify_connection():
            logger.error("❌ No se pudo verificar la conexión con Jira. Abortando.")
            sys.exit(1)

    # ─── Procesar Épicas y Stories ───
    total_epics_created = 0
    total_stories_created = 0
    errors = []

    for epic_data in epics:
        epic_id = epic_data.get('id', 'UNKNOWN')

        # Filtrar por épica específica si se pasó --epic
        if args.epic and epic_id != args.epic:
            logger.debug(f"⏭️  Saltando épica {epic_id} (filtro: {args.epic})")
            continue

        logger.info(f"\n{'─' * 50}")
        logger.info(f"🗂️  Procesando Épica [{epic_id}]: {epic_data.get('title', '')}")
        logger.info(f"{'─' * 50}")

        # Crear la épica
        epic_key = client.create_epic(epic_data, dry_run=args.dry_run)

        if epic_key:
            total_epics_created += 1

            # Crear las stories vinculadas a esta épica
            stories = epic_data.get('stories', [])
            logger.info(f"   📚 Stories en esta épica: {len(stories)}")

            for story_data in stories:
                story_key = client.create_story(
                    story_data=story_data,
                    epic_key=epic_key,
                    dry_run=args.dry_run,
                )
                if story_key:
                    total_stories_created += 1
                else:
                    errors.append(f"Story '{story_data.get('title')}' en épica {epic_key}")
        else:
            errors.append(f"Épica '{epic_data.get('title')}'")

    # ─── Resumen final ───
    logger.info(f"\n{'=' * 70}")
    logger.info("📊 RESUMEN DE EJECUCIÓN")
    logger.info(f"{'=' * 70}")
    logger.info(f"   ✅ Épicas {'simuladas' if args.dry_run else 'creadas'}: {total_epics_created}")
    logger.info(f"   ✅ Stories {'simuladas' if args.dry_run else 'creadas'}: {total_stories_created}")

    if errors:
        logger.warning(f"   ⚠️  Errores ({len(errors)}):")
        for error in errors:
            logger.warning(f"      - {error}")
    else:
        logger.info("   🎉 Sin errores. Proceso completado exitosamente.")

    logger.info(f"{'=' * 70}")


if __name__ == '__main__':
    main()
