-- Shivay Mobile - Database Schema
-- Database: shivay_mobile

CREATE DATABASE IF NOT EXISTS shivay_mobile
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shivay_mobile;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'sameer') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_amount DECIMAL(10, 2) NOT NULL,
  purchase_cost DECIMAL(10, 2) NOT NULL,
  source_shop VARCHAR(255) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  cost_breakdown JSON NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  settlement_status ENUM('pending', 'settled') NOT NULL DEFAULT 'pending',
  settled_at DATETIME NULL,
  settled_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_entries_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_entries_settled_by FOREIGN KEY (settled_by) REFERENCES users(id),
  INDEX idx_entry_date (entry_date),
  INDEX idx_customer_name (customer_name),
  INDEX idx_item_name (item_name),
  INDEX idx_source_shop (source_shop),
  INDEX idx_settlement_status (settlement_status),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
