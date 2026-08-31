import { defineConfig } from 'drizzle-kit'

const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.NUXT_TURSO_DATABASE_URL ||
  process.env.NUXT_TURSO_URL ||
  'file:./dev.db'

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.NUXT_TURSO_AUTH_TOKEN ||
  ''

const isTurso = url.startsWith('libsql://') || url.startsWith('https://')

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: isTurso ? 'turso' : 'sqlite',
  dbCredentials: isTurso
    ? { url, authToken }
    : { url },
})
