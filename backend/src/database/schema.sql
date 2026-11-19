-- Zephora — schema SQLite (node:sqlite)
-- Obs.: PRAGMA foreign_keys é por conexão; ative em toda abertura do banco.
PRAGMA foreign_keys = ON;

-- ===================== USERS =====================
CREATE TABLE IF NOT EXISTS users (
  id                           INTEGER PRIMARY KEY AUTOINCREMENT,
  name                         TEXT    NOT NULL,
  email                        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash                TEXT    NOT NULL,
  role                         TEXT    NOT NULL DEFAULT 'member'
                                       CHECK (role IN ('owner', 'admin', 'member')),
  avatar_path                  TEXT,
  email_verified_at            TEXT,

  verification_code_hash       TEXT,
  verification_code_expires_at TEXT,
  verification_code_attempts   INTEGER NOT NULL DEFAULT 0,

  reset_code_hash              TEXT,
  reset_code_expires_at        TEXT,
  reset_code_attempts          INTEGER NOT NULL DEFAULT 0,

  is_active                    INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at                   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garante um único owner (admin padrão da instituição)
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_single_owner
  ON users (role) WHERE role = 'owner';

-- ===================== ROOMS =====================
CREATE TABLE IF NOT EXISTS rooms (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  description  TEXT,
  photo_1_path TEXT,
  photo_2_path TEXT,
  photo_3_path TEXT,
  created_by   INTEGER NOT NULL REFERENCES users (id),
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================== ROOM ACCESS =====================
CREATE TABLE IF NOT EXISTS room_access (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  room_id    INTEGER NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
  granted_by INTEGER NOT NULL REFERENCES users (id),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, room_id)
);

CREATE INDEX IF NOT EXISTS ix_room_access_room ON room_access (room_id);

-- ===================== ESP32 MODULES =====================
CREATE TABLE IF NOT EXISTS esp32_modules (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_hash  TEXT    NOT NULL UNIQUE,
  credential_hint  TEXT,
  name             TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'online', 'offline')),
  firmware_version TEXT,
  last_seen_at     TEXT,
  registered_by    INTEGER NOT NULL REFERENCES users (id),
  created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================== DEVICES =====================
CREATE TABLE IF NOT EXISTS devices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  esp32_id            INTEGER NOT NULL REFERENCES esp32_modules (id) ON DELETE CASCADE,
  room_id             INTEGER REFERENCES rooms (id) ON DELETE RESTRICT,
  name                TEXT    NOT NULL,
  type                TEXT    NOT NULL CHECK (type IN ('light', 'presence_sensor', 'temperature_sensor')),
  channel             TEXT    NOT NULL,
  registration_status TEXT    NOT NULL DEFAULT 'discovered'
                              CHECK (registration_status IN ('discovered', 'registered')),
  desired_state       TEXT,   -- JSON
  current_state       TEXT,   -- JSON
  state_updated_at    TEXT,
  registered_by       INTEGER REFERENCES users (id),
  created_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (esp32_id, channel),
  CHECK (registration_status = 'discovered' OR room_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_devices_room ON devices (room_id);

-- ===================== AUTOMATIONS =====================
CREATE TABLE IF NOT EXISTS automations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id    INTEGER NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  is_paused  INTEGER NOT NULL DEFAULT 0 CHECK (is_paused IN (0, 1)),
  paused_by  INTEGER REFERENCES users (id),
  paused_at  TEXT,
  created_by INTEGER NOT NULL REFERENCES users (id),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_automations_room ON automations (room_id);

CREATE TABLE IF NOT EXISTS automation_devices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  automation_id INTEGER NOT NULL REFERENCES automations (id) ON DELETE CASCADE,
  device_id     INTEGER NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
  role          TEXT    NOT NULL CHECK (role IN ('trigger', 'action')),
  config        TEXT    NOT NULL, -- JSON
  UNIQUE (automation_id, device_id, role)
);

-- Busca de automações a partir do sensor que acabou de reportar
CREATE INDEX IF NOT EXISTS ix_automation_devices_device_role
  ON automation_devices (device_id, role);
