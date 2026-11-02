-- Run once on server (phpMyAdmin / MySQL)
USE u723435472_shivaymobile;

CREATE TABLE IF NOT EXISTS saved_names (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name_type ENUM('customer', 'source') NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_key VARCHAR(255) NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_saved_name (name_type, name_key),
  CONSTRAINT fk_saved_names_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_saved_name_type (name_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
