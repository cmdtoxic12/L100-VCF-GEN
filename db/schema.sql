-- L100 Contacts — canonical schema.
-- Fresh database: paste this whole file into the Neon SQL editor and run it.
-- Existing database: see the migration block at the bottom.

CREATE TABLE IF NOT EXISTS contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text NOT NULL,
  whatsapp   text NOT NULL,
  level      text NOT NULL DEFAULT 'L100',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contacts_full_name_length
    CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
  CONSTRAINT contacts_whatsapp_format
    CHECK (whatsapp ~ '^0[235][0-9]{8}$'),
  CONSTRAINT contacts_level_value
    CHECK (level = 'L100')
);

-- One row per phone number. The API relies on this index to reject duplicates,
-- so two simultaneous submissions cannot both be inserted.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_whatsapp_unique ON contacts (whatsapp);

-- Two classmates can legitimately share a name, so names are NOT unique.
-- The API stores the row and returns `nameWarning: true` instead.
DROP INDEX IF EXISTS contacts_fullname_unique;

-- ---------------------------------------------------------------------------
-- Migration for a database created with the original README schema
-- (nullable created_at, no format checks, unique names). Run once:
--
--   ALTER TABLE contacts ALTER COLUMN created_at SET DEFAULT now();
--   UPDATE contacts SET created_at = now() WHERE created_at IS NULL;
--   ALTER TABLE contacts ALTER COLUMN created_at SET NOT NULL;
--   DROP INDEX IF EXISTS contacts_fullname_unique;
--
-- Then normalise any legacy numbers before adding the format check:
--
--   UPDATE contacts SET whatsapp = regexp_replace(whatsapp, '[^0-9+]', '', 'g');
--   UPDATE contacts
--      SET whatsapp = '0' || substring(whatsapp from 5)
--    WHERE whatsapp LIKE '+233%';
--
--   ALTER TABLE contacts
--     ADD CONSTRAINT contacts_whatsapp_format CHECK (whatsapp ~ '^0[235][0-9]{8}$');
-- ---------------------------------------------------------------------------
