export interface Migration {
  version: number;
  name: string;
  sql: string;
  checksum: string;
}

function computeChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

const m001InitialSchema = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(name) >= 1),
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TEXT NOT NULL DEFAULT '[]',
  start_date TEXT NOT NULL,
  duration TEXT NOT NULL,
  notes TEXT,
  color TEXT NOT NULL DEFAULT '#2DB19A',
  reminder_enabled INTEGER NOT NULL DEFAULT 1 CHECK(reminder_enabled IN (0,1)),
  current_supply REAL NOT NULL DEFAULT 0 CHECK(current_supply >= 0),
  total_supply REAL NOT NULL DEFAULT 0 CHECK(total_supply >= 0),
  refill_at REAL NOT NULL DEFAULT 0 CHECK(refill_at >= 0),
  refill_reminder INTEGER NOT NULL DEFAULT 0 CHECK(refill_reminder IN (0,1)),
  last_refill_date TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dose_history (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  taken INTEGER NOT NULL DEFAULT 0 CHECK(taken IN (0,1)),
  status TEXT NOT NULL CHECK(status IN ('taken','missed','skipped')),
  scheduled_time TEXT,
  dose_date TEXT NOT NULL,
  notes TEXT,
  supply_before REAL,
  supply_after REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(medication_id, dose_date, scheduled_time)
);

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY,
  medication_id TEXT REFERENCES medications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('dose','refill','missed')),
  scheduled_for TEXT NOT NULL,
  expo_notif_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1)),
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_medications_active
  ON medications(is_deleted, frequency);

CREATE INDEX IF NOT EXISTS idx_medications_start_date
  ON medications(start_date)
  WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_dose_history_medication
  ON dose_history(medication_id, dose_date);

CREATE INDEX IF NOT EXISTS idx_dose_history_date
  ON dose_history(dose_date, status);

CREATE INDEX IF NOT EXISTS idx_dose_history_timestamp
  ON dose_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notification_events(is_read, scheduled_for)
  WHERE is_read = 0;

CREATE TRIGGER IF NOT EXISTS trg_medications_updated_at
AFTER UPDATE ON medications
FOR EACH ROW
BEGIN
  UPDATE medications SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_dose_history_updated_at
AFTER UPDATE ON dose_history
FOR EACH ROW
BEGIN
  UPDATE dose_history SET updated_at = datetime('now') WHERE id = NEW.id;
END;

INSERT OR IGNORE INTO app_settings (key, value)
VALUES
  ('app_version', '"2.0.0"'),
  ('schema_version', '1'),
  ('theme', '"system"'),
  ('language', '"en"'),
  ('backup_auto_enabled', 'true'),
  ('backup_interval_days', '7');
`;

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: m001InitialSchema,
    checksum: computeChecksum(m001InitialSchema),
  },
];
