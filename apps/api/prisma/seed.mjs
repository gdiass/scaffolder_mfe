import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  await client.query('SELECT 1');
  await client.end();

  console.log('Seed da aplicação concluído.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
