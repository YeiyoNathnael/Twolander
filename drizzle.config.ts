import { defineConfig } from 'drizzle-kit'

const url = process.env.TURSO_DATABASE_URL ?? 'file:./dev.db'
const isTurso = url.startsWith('libsql://')

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  // Use 'turso' only for remote Turso cloud URLs; 'sqlite' for local file dev
  dialect: isTurso ? 'turso' : 'sqlite',
  dbCredentials: isTurso
    ? { url, authToken: process.env.TURSO_AUTH_TOKEN ?? '' }
    : { url },
})
