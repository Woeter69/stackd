-- Stackd schema
-- Run this in your Neon SQL editor or any PostgreSQL client

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  global_balance INTEGER      NOT NULL DEFAULT 1000,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       VARCHAR(5)  NOT NULL UNIQUE,
  game_type  VARCHAR(20) NOT NULL DEFAULT 'poker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id),
  name       VARCHAR(100) NOT NULL,
  role       VARCHAR(10)  NOT NULL CHECK (role IN ('banker', 'player')),
  balance    INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES players(id),
  receiver_id UUID        NOT NULL REFERENCES players(id),
  amount      INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
