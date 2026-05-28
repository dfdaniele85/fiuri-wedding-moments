-- ============================================================
-- Fiuri Wedding Moments — Migrazione iniziale
-- Eseguire nel SQL Editor di Supabase
-- ============================================================

-- Abilita UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella eventi
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  access_code   TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabella upload media
CREATE TABLE IF NOT EXISTS media_uploads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_name        TEXT,
  original_filename TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  file_type         TEXT NOT NULL CHECK (file_type IN ('photo', 'video', 'other')),
  mime_type         TEXT NOT NULL,
  size_bytes        BIGINT NOT NULL,
  upload_status     TEXT NOT NULL DEFAULT 'completed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent        TEXT
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS media_uploads_event_id_idx ON media_uploads(event_id);
CREATE INDEX IF NOT EXISTS media_uploads_created_at_idx ON media_uploads(created_at);
CREATE INDEX IF NOT EXISTS media_uploads_file_type_idx ON media_uploads(file_type);
CREATE INDEX IF NOT EXISTS events_slug_idx ON events(slug);

-- ============================================================
-- RLS (Row Level Security)
-- Gli ospiti non accedono mai direttamente al DB.
-- Le API usano la service role key — RLS disabilitato
-- o abilitato con policy permissive solo per lettura pubblica
-- di eventi attivi (opzionale, non esponiamo dati sensibili).
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;

-- Nessuna policy pubblica: tutte le operazioni passano
-- attraverso le API con service_role key.
-- Il client lato browser usa solo la anon key che non ha
-- permessi su queste tabelle grazie a RLS.

-- ============================================================
-- Storage bucket (da creare nella dashboard Supabase o CLI)
-- Nome: wedding-media
-- Tipo: PRIVATO (public: false)
-- ============================================================
-- Non è possibile creare bucket via SQL migration.
-- Vedi README per le istruzioni.

-- ============================================================
-- Evento di esempio (opzionale, da adattare)
-- ============================================================
-- INSERT INTO events (slug, title, access_code)
-- VALUES ('marco-giulia-2025', 'Matrimonio Marco & Giulia', 'fiori2025');
