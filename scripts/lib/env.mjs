import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_KEYS = [
  'NODE_ENV',
  'API_PORT',
  'WEB_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_PORT',
  'DATABASE_URL'
];

export const rootDir = process.cwd();
export const envPath = path.join(rootDir, '.env');

export function parseEnvFile(filePath = envPath) {
  if (!fs.existsSync(filePath)) {
    throw new Error([
      'Arquivo .env não encontrado.',
      'Copie .env.example para .env antes de continuar.',
      'Exemplo: cp .env.example .env'
    ].join('\n'));
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function loadEnv() {
  const env = parseEnvFile();
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  return process.env;
}

export function validateEnv() {
  const env = loadEnv();
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error([
      'Variáveis obrigatórias ausentes no .env:',
      ...missing.map((key) => `- ${key}`),
      '',
      'Revise .env.example e preencha os valores necessários.'
    ].join('\n'));
  }

  for (const key of ['API_PORT', 'WEB_PORT', 'POSTGRES_PORT']) {
    const value = Number(env[key]);
    if (!Number.isInteger(value) || value <= 0 || value > 65535) {
      throw new Error(`Valor inválido para ${key}: ${env[key]}. Informe uma porta entre 1 e 65535.`);
    }
  }

  for (const key of ['POSTGRES_DB', 'POSTGRES_USER']) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(env[key])) {
      throw new Error(`Valor inválido para ${key}: ${env[key]}. Use apenas letras, números e underscore.`);
    }
  }

  // Deriva _BASE_URL a partir de _PORT quando não definida explicitamente
  const urlDefaults = {
    API_BASE_URL: `http://localhost:${env.API_PORT}`,
    WEB_BASE_URL: `http://localhost:${env.WEB_PORT}`,
    SHELL_BASE_URL: 'http://localhost:3000',
  };
  for (const [key, fallback] of Object.entries(urlDefaults)) {
    if (!env[key]) {
      env[key] = fallback;
      process.env[key] = fallback;
    }
  }

  for (const key of ['API_BASE_URL', 'WEB_BASE_URL', 'SHELL_BASE_URL']) {
    try {
      const url = new URL(env[key]);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new Error('scheme');
      }
      if (env.NODE_ENV === 'production' && url.protocol !== 'https:') {
        throw new Error('https');
      }
    } catch {
      throw new Error(`Valor inválido para ${key}: ${env[key]}. Informe uma URL HTTP(S)${env.NODE_ENV === 'production' ? ' com HTTPS' : ''}.`);
    }
  }

  return env;
}
