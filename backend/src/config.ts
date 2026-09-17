import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(here, '../../.env') })
dotenv.config({ path: path.resolve(here, '../.env') })

export const config = {
  port: Number(process.env.PORT ?? 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mysql: {
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'multi_doc',
  },
  upload: {
    maxFiles: Number(process.env.MAX_FILES ?? 5),
    maxFileBytes: Number(process.env.MAX_FILE_BYTES ?? 2 * 1024 * 1024),
  },
  ai: {
    provider: (process.env.AI_PROVIDER ?? 'mock').toLowerCase(),
    openaiKey: process.env.OPENAI_API_KEY ?? '',
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
  auth: {
    username: process.env.LOGIN_USERNAME ?? 'analyst',
    password: process.env.LOGIN_PASSWORD ?? 'ChangeMe!2026',
    sessionSecret: process.env.SESSION_SECRET ?? 'dev-only-change-me-use-at-least-32-chars',
    sessionTtlMs: 8 * 60 * 60 * 1000,
    cookieName: 'mdiw_sid',
  },
  contentLimitChars: 20_000,
}
