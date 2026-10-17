#!/usr/bin/env bash
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="\$(cd "(dirname "{BASH_SOURCE[0]}")" && pwd)"
cd "\$ROOT_DIR"

PROJECT_NAME=""
TARGET_DIR=""
PROJECT_DESCRIPTION=""
DB_NAME=""
API_PORT="3001"
WEB_PORT="5174"
DB_PORT="5433" # Alterado para 5433 para evitar conflito com o Host principal
GIT_REMOTE_URL=""
SKIP_INSTALL=0
SKIP_GIT=0
BOOTSTRAP=0
IN_PLACE=0

info()  { echo -e "CYAN⚡{NC} \$1"; }
ok()    { echo -e "GREEN✓{NC} \$1"; }
warn()  { echo -e "YELLOW⚠{NC} \$1"; }
fail()  { echo -e "RED✖{NC} \$1"; }
bold()  { echo -e "\${BOLD}1{NC}"; }

usage() {
  cat <<'EOF'
Uso: ./setup.sh [opções]

Cria um novo projeto derivado a partir do template AppStart MFE.

Opções:
  --name <kebab-case>         Nome do projeto
  --dir <caminho>             Diretório de destino
  --description <texto>       Descrição do projeto
  --db-name <snake_case>      Nome do banco de dados
  --api-port <porta>          Porta da API (padrão: 3001)
  --web-port <porta>          Porta do frontend (padrão: 5174)
  --db-port <porta>           Porta publicada do PostgreSQL (padrão: 5433)
  --git-remote <url>          Remote Git opcional para o projeto derivado
  --skip-install              Não executa pnpm install
  --skip-git                  Não executa git init
  --bootstrap                 Executa pnpm run setup ao final
  --in-place                  Configura o repositório no diretório atual (não faz cópia)
  -h, --help                  Mostra esta ajuda
EOF
}

while [[ \$# -gt 0 ]]; do
  case "\$1" in
    --name) PROJECT_NAME="\${2:-}"; shift 2 ;;
    --dir) TARGET_DIR="\${2:-}"; shift 2 ;;
    --description) PROJECT_DESCRIPTION="\${2:-}"; shift 2 ;;
    --db-name) DB_NAME="\${2:-}"; shift 2 ;;
    --api-port) API_PORT="\${2:-}"; shift 2 ;;
    --web-port) WEB_PORT="\${2:-}"; shift 2 ;;
    --db-port) DB_PORT="\${2:-}"; shift 2 ;;
    --git-remote) GIT_REMOTE_URL="\${2:-}"; shift 2 ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --skip-git) SKIP_GIT=1; shift ;;
    --bootstrap) BOOTSTRAP=1; shift ;;
    --in-place) IN_PLACE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Opção desconhecida: \$1"; echo; usage; exit 1 ;;
  esac
done

if [[ ! -f "\(ROOT_DIR/package.json" \vert{}\vert{} ! -f "\)ROOT_DIR/.env.example" ]]; then
  fail "Parece que você não está na raiz do template MFE."
  exit 1
fi

validate_project_name() { [[ "\(1" =~ ^[a-z0-9]+(-[a-z0-9]+)*\) ]]; }
validate_db_name() { [[ "\(1" =~ ^[a-z0-9_]+\) ]]; }
validate_port() { [[ "\(1" =~ ^[0-9]+\) ]] && (( "\$1" >= 1 && "\$1" <= 65535 )); }

require_value() {
  local current="\$1" prompt="\$2" default_value="3:-" result="current"
  if [[ -n "\$result" ]]; then printf '%s' "\$result"; return 0; fi
  if [[ ! -t 0 ]]; then
    if [[ -n "\$default_value" ]]; then printf '%s' "\$default_value"; return 0; fi
    fail "Parâmetro obrigatório ausente em modo não interativo: \$prompt" >&2; exit 1
  fi
  read -r -p "prompt" result; result="{result:-\(default_value}"; printf '\%s' "\)result"
}

if [[ -t 1 ]]; then clear 2>/dev/null || true; fi
bold "  ┌─────────────────────────────────────────────┐"
bold "  │             AppStart - MFE                  │"
bold "  │       Scaffolding guiado de projeto         │"
bold "  └─────────────────────────────────────────────┘"
echo ""

PROJECT_NAME="\((require_value "\)PROJECT_NAME" "Nome do projeto (kebab-case): ")"
while ! validate_project_name "\$PROJECT_NAME"; do
  warn "O nome deve estar em kebab-case (ex: meu-mfe)."
  PROJECT_NAME="\$(require_value "" "Nome do projeto (kebab-case): ")"
done

if [[ "\$IN_PLACE" -eq 1 ]]; then
  TARGET_DIR="."
else
  DEFAULT_TARGET_DIR="../\$PROJECT_NAME"
  TARGET_DIR="\((require_value "\)TARGET_DIR" "Diretório de destino [\({DEFAULT_TARGET_DIR}]: " "\)DEFAULT_TARGET_DIR")"
  if [[ -e "\$TARGET_DIR" && -n "(find "TARGET_DIR" -mindepth 1 -maxdepth 1 2>/dev/null)" ]]; then
    fail "O diretório '\$TARGET_DIR' já existe e não está vazio."
    exit 1
  fi
fi

DEFAULT_DESCRIPTION="Micro Frontend derivado de \$PROJECT_NAME."
PROJECT_DESCRIPTION="\((require_value "\)PROJECT_DESCRIPTION" "Descrição do projeto [\({DEFAULT_DESCRIPTION}]: " "\)DEFAULT_DESCRIPTION")"

DEFAULT_DB_NAME="\${PROJECT_NAME//-/_}"
DB_NAME="\((require_value "\)DB_NAME" "Nome do banco de dados (snake_case) [\({DEFAULT_DB_NAME}]: " "\)DEFAULT_DB_NAME")"
while ! validate_db_name "\$DB_NAME"; do
  warn "O nome do banco deve usar snake_case."
  DB_NAME="\$(require_value "" "Nome do banco de dados [\({DEFAULT_DB_NAME}]: " "\)DEFAULT_DB_NAME")"
done

API_PORT="\((require_value "\)API_PORT" "Porta da API: " "3001")"
WEB_PORT="\((require_value "\)WEB_PORT" "Porta do frontend: " "5174")"
DB_PORT="\((require_value "\)DB_PORT" "Porta do PostgreSQL: " "5433")"

if [[ "\$IN_PLACE" -eq 0 ]]; then
  info "Criando projeto em '\${TARGET_DIR}'..."
  mkdir -p "\$TARGET_DIR"
  tar -cf - --exclude='./.git' --exclude='./node_modules' --exclude='*/dist/' --exclude='./.env' . | (cd "\$TARGET_DIR" && tar -xf -)
fi

cp "\(TARGET_DIR/.env.example" "\)TARGET_DIR/.env"

info "Aplicando configuração..."
node - "\$TARGET_DIR" "\(PROJECT_NAME" "\)PROJECT_DESCRIPTION" "\(DB_NAME" "\)API_PORT" "\(WEB_PORT" "\)DB_PORT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [targetDir, projectName, projectDescription, dbName, apiPort, webPort, dbPort] = process.argv.slice(2);

const dbUser = dbName;
const dbPassword = `${dbName}_dev_password`;
const databaseUrl = `postgresql://${dbUser}:${dbPassword}@localhost:${dbPort}/${dbName}?schema=public`;

function updateEnvFile(relativePath) {
  const fullPath = path.join(targetDir, relativePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  const replacements = {
    API_PORT: apiPort,
    WEB_PORT: webPort,
    POSTGRES_DB: dbName,
    POSTGRES_USER: dbUser,
    POSTGRES_PASSWORD: dbPassword,
    POSTGRES_PORT: dbPort,
    DATABASE_URL: databaseUrl
  };
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    content = content.replace(pattern, `${key}=${value}`);
  }
  fs.writeFileSync(fullPath, content);
}

updateEnvFile('.env.example');
updateEnvFile('.env');

const composePath = path.join(targetDir, 'compose.yaml');
if (fs.existsSync(composePath)) {
  let compose = fs.readFileSync(composePath, 'utf8');
  compose = compose.replace(/appstart-postgres/g, `${projectName}-postgres`);
  fs.writeFileSync(composePath, compose);
}
NODE

ok "Configuração concluída com sucesso para o MFE!"
