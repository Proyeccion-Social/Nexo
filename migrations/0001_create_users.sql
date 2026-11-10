-- Migración inicial para PostgreSQL. Aplicar una sola vez en una base vacía.
BEGIN;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nickname VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  student_code VARCHAR(11) NOT NULL,
  entry_semester VARCHAR(6) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ESTUDIANTE',
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_nickname UNIQUE (nickname),
  CONSTRAINT uq_users_student_code UNIQUE (student_code),
  CONSTRAINT ck_users_email_domain CHECK (email ~ '^[^[:space:]@]+@udistrital[.]edu[.]co$'),
  CONSTRAINT ck_users_nickname CHECK (nickname ~ '^[A-Za-z][A-Za-z0-9_]{2,29}$'),
  CONSTRAINT ck_users_student_code CHECK (student_code ~ '^[0-9]{4}[13][0-9]{3}(00[1-9]|0[1-9][0-9]|[12][0-9]{2})$'),
  CONSTRAINT ck_users_role CHECK (role IN ('ESTUDIANTE', 'ADMINISTRADOR'))
);

COMMIT;
