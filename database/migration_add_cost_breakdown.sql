-- Add cost breakdown support for multi-item entries
-- Run once: mysql -u root shivay_mobile < database/migration_add_cost_breakdown.sql

USE shivay_mobile;

ALTER TABLE entries
  ADD COLUMN cost_breakdown JSON NULL AFTER profit;
