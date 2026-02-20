CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('INVESTOR', 'STARTUP', 'INTERN_SEEKER', 'INFLUENCER', 'ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,

  role user_role NOT NULL DEFAULT 'INTERN_SEEKER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  auth_provider TEXT NOT NULL DEFAULT 'local', -- 'local' or 'google'
  google_id TEXT UNIQUE,
  avatar_url TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);