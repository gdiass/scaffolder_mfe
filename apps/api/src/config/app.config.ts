export const APP_CONFIG = Symbol('APP_CONFIG');

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  apiPort: number;
  apiBaseUrl: string;
  webBaseUrl: string;
  shellBaseUrl: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}.`);
  return value;
}

function port(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) throw new Error(`${name} deve ser uma porta entre 1 e 65535.`);
  return parsed;
}

function baseUrl(value: string, name: string): string {
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${name} deve ser uma URL válida.`); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(`${name} deve ser uma URL HTTP(S) sem credenciais.`);
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

export function createAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnvValue = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnvValue)) throw new Error('NODE_ENV deve ser development, test ou production.');
  const apiPort = port(required(env, 'API_PORT'), 'API_PORT');
  const webPort = port(required(env, 'WEB_PORT'), 'WEB_PORT');
  const apiBaseUrl = baseUrl(env.API_BASE_URL ?? `http://localhost:${apiPort}`, 'API_BASE_URL');
  const webBaseUrl = baseUrl(env.WEB_BASE_URL ?? `http://localhost:${webPort}`, 'WEB_BASE_URL');
  const shellBaseUrl = baseUrl(env.SHELL_BASE_URL ?? 'http://localhost:3000', 'SHELL_BASE_URL');
  if (nodeEnvValue === 'production') {
    for (const [name, value] of [['API_BASE_URL', apiBaseUrl], ['WEB_BASE_URL', webBaseUrl], ['SHELL_BASE_URL', shellBaseUrl]] as const) {
      if (new URL(value).protocol !== 'https:') throw new Error(`${name} deve usar HTTPS em produção.`);
    }
  }
  return { nodeEnv: nodeEnvValue as AppConfig['nodeEnv'], apiPort, apiBaseUrl, webBaseUrl, shellBaseUrl };
}