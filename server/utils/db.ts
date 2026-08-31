import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../db/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

/**
 * Singleton Drizzle instance. Auto-imported by Nitro in all server routes.
 * Seamlessly resolves Turso Cloud URLs or local SQLite dev database.
 */
export function useDb() {
  if (_db) return _db

  const config = useRuntimeConfig()

  const url =
    config.tursoUrl ||
    process.env.TURSO_DATABASE_URL ||
    process.env.NUXT_TURSO_DATABASE_URL ||
    'file:./dev.db'

  const authToken =
    config.tursoAuthToken ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.NUXT_TURSO_AUTH_TOKEN ||
    undefined

  const client = createClient({
    url,
    authToken,
  })

  _db = drizzle(client, { schema })
  return _db
}
