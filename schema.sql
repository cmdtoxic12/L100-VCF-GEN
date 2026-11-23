CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  whatsapp VARCHAR(13) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'Level 100' CHECK (level = 'Level 100'),
  vcf_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contacts_whatsapp_unique UNIQUE(whatsapp)
);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_name_unique ON contacts (lower(trim(full_name)));
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts(created_at DESC);
CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);
