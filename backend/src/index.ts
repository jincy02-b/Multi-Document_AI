import { createApp } from './app.ts'
import { config } from './config.ts'
import { ensureSchema } from './db/schema.ts'

const app = createApp()

try {
  await ensureSchema()
  console.log(`MySQL database '${config.mysql.database}' is ready`)
} catch (error) {
  console.error('Failed to initialise MySQL. Check MYSQL_* values in .env', error)
  process.exit(1)
}

app.listen(config.port, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${config.port}`)
})

