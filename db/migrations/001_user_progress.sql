CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  records JSONB NOT NULL DEFAULT '{}'::jsonb,
  study_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  speed SMALLINT NOT NULL DEFAULT -15 CHECK (speed BETWEEN -40 AND 20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_progress_updated_at_idx ON user_progress (updated_at DESC);
