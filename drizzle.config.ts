import { defineConfig } from 'drizzle-kit';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = defineConfig({
  schema: resolve(__dirname, './shared/schema.ts'),
  out: resolve(__dirname, './migrations'),
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgresql://grantifuel:grantifuel@localhost:5432/grantifuel',
  },
  verbose: true,
  strict: true,
});

export default config;
