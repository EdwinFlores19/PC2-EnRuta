/**
 * src/utils/sunatScraper.ts — Consulta y simulación de Web Scraping SUNAT (TypeScript)
 */

import logger from './logger';

export interface SunatRucResult {
  ruc: string;
  razonSocial: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BAJA_DE_OFICIO';
  condicion: 'HABIDO' | 'NO_HABIDO' | 'NO_HALLADO';
  direccion: string;
  regimenTributario: 'NRUS' | 'RER' | 'RG' | 'MIPE';
}

/**
 * Consulta un RUC simulando un Web Scraper o API gratuita de la SUNAT.
 * Garantiza un funcionamiento óptimo y libre de caídas para la demostración técnica.
 * @param ruc Número de RUC de 11 dígitos
 */
export async function scrapSunatRuc(ruc: string): Promise<SunatRucResult> {
  logger.info(`Iniciando consulta SUNAT para RUC: ${ruc}`);

  // Validación básica de estructura del RUC peruano
  const rucPattern = /^(10|20|15|17)\d{9}$/;
  if (!rucPattern.test(ruc) || ruc.length !== 11) {
    throw new Error('El RUC proporcionado no tiene un formato válido de 11 dígitos de SUNAT Perú.');
  }

  // Simulación de delay de red del scraper (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Extracción de datos basados en el tipo de RUC
  const isPersonaNatural = ruc.startsWith('10');
  const dniAsociado = isPersonaNatural ? ruc.substring(2, 10) : '';

  if (isPersonaNatural) {
    return {
      ruc,
      razonSocial: `PERSONA NATURAL CON NEGOCIO (Asociado a DNI: ${dniAsociado})`,
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: 'AV. PETIT THOUARS 1150, MIRAFLORES, LIMA',
      regimenTributario: 'NRUS', // Nuevo Régimen Único Simplificado (ideal para Ruta A)
    };
  } else if (ruc.startsWith('20')) {
    return {
      ruc,
      razonSocial: 'SERVICIOS LIMPIOS S.A.C. (B2B Aliado Semáforo Social)',
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: 'JR. CARABAYA 450, CERCADO DE LIMA, LIMA',
      regimenTributario: 'MIPE', // Régimen MYPE Tributario
    };
  } else {
    return {
      ruc,
      razonSocial: 'ENTIDAD O ASOCIACIÓN INDEPENDIENTE',
      estado: 'ACTIVO',
      condicion: 'HABIDO',
      direccion: 'LIMA, PERÚ',
      regimenTributario: 'RER',
    };
  }
}
