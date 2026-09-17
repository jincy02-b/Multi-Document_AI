CREATE DATABASE IF NOT EXISTS multi_doc
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE multi_doc;

CREATE TABLE IF NOT EXISTS analyses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  instruction VARCHAR(2000) NOT NULL,
  result_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analyses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
