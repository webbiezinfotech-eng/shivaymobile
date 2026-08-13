-- Shivay Mobile - Seed Data (DEVELOPMENT ONLY)
-- Passwords: owner123 / sameer123 — change before production!

USE shivay_mobile;

INSERT INTO users (name, username, password_hash, role, is_active) VALUES
(
  'Shivay Mobile Owner',
  'owner',
  '$2y$12$.6/lGh/KDHUnvnGRPTv1k.ZhwxGbJmmWw0M4xKTzwsgIP9IvT8Euy',
  'owner',
  1
),
(
  'Sameer',
  'sameer',
  '$2y$12$VxLrISr0ZBop0iSj8ciYquhTG3TDaLyp7qz8.NzzEarCjZ4SwymZK',
  'sameer',
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  is_active = 1;
