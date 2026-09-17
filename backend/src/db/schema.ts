import mysql from 'mysql2/promise'
import { config } from '../config.ts'
import { getPool } from './pool.ts'

const CREATE_ANALYSES = `
CREATE TABLE IF NOT EXISTS analyses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  instruction VARCHAR(2000) NOT NULL,
  result_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analyses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`

const CREATE_DOCUMENTS = `
CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  analysis_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_name CHAR(36) NOT NULL,
  extension VARCHAR(10) NOT NULL,
  mime_type VARCHAR(127) NOT NULL,
  byte_size INT NOT NULL,
  status ENUM('processed','unsupported','unreadable','empty','invalid','failed') NOT NULL,
  error_message VARCHAR(512) NULL,
  truncated TINYINT(1) NOT NULL DEFAULT 0,
  extracted_char_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_analysis
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  INDEX idx_documents_user (user_id),
  INDEX idx_documents_analysis (analysis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`

export async function ensureDatabase(): Promise<void> {
  const admin = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: false,
  })
  try {
    if (!/^[a-zA-Z0-9_]+$/.test(config.mysql.database)) {
      throw new Error('MYSQL_DATABASE contains unsupported characters')
    }
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.mysql.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
  } finally {
    await admin.end()
  }
}

export async function ensureSchema(): Promise<void> {
  await ensureDatabase()
  const pool = getPool()
  await pool.query(CREATE_ANALYSES)
  await pool.query(CREATE_DOCUMENTS)
}

if (process.argv[1]?.includes('bootstrap')) {
  ensureSchema()
    .then(() => {
      console.log(`Database '${config.mysql.database}' is ready`)
      process.exit(0)
    })
    .catch((err: unknown) => {
      console.error('Database bootstrap failed', err)
      process.exit(1)
    })
}
