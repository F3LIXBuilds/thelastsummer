CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username));

CREATE TABLE IF NOT EXISTS player_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  pronouns TEXT NOT NULL DEFAULT 'they/them',
  appearance JSONB NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- One row per user per story. `state` holds relationships, stats, inventory, flags, decisions.
CREATE TABLE IF NOT EXISTS player_progress (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  scene_id TEXT,                              -- NULL = between episodes
  picks JSONB NOT NULL DEFAULT '[]',          -- choices made inside the current scene
  state JSONB NOT NULL,                       -- state at start of current scene (or carry-over state)
  snapshots JSONB NOT NULL DEFAULT '{}',      -- episodeId -> state at episode start (for restart/replay)
  completed TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS player_decisions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  scene_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS player_decisions_user_story ON player_decisions (user_id, story_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player';

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  setting TEXT NOT NULL DEFAULT '',
  genre JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  characters JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS episodes (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  season_id TEXT NOT NULL DEFAULT 'season-1',
  season_title TEXT NOT NULL DEFAULT 'Season 1',
  position INT NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, id)
);
CREATE INDEX IF NOT EXISTS episodes_order ON episodes (story_id, position);

CREATE TABLE IF NOT EXISTS media (
  name TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  data BYTEA NOT NULL,
  size INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backgrounds (
  name TEXT PRIMARY KEY,
  sky JSONB NOT NULL,
  kind TEXT NOT NULL DEFAULT 'none',
  stars BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


