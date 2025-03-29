const { defineConfig } = require('drizzle-kit');
const path = require('path');

module.exports = defineConfig({
  schema: path.resolve(__dirname, './shared/schema.ts'),
  out: path.resolve(__dirname, './migrations'),
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://grantifuel:grantifuel@localhost:5432/grantifuel',
  },
  verbose: true,
  strict: true,
}); 