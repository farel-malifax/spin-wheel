// lib/db.ts
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "database.sqlite");
const db = new Database(dbPath);

// Buat tabel kalau belum ada
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    companyName TEXT,
    token TEXT UNIQUE,
    is_deleted BOOLEAN
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    winner TEXT
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_id INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    is_spun INTEGER DEFAULT 0,
    FOREIGN KEY(prize_id) REFERENCES prizes(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_id INTEGER NOT NULL,
    won_at TEXT NOT NULL,
    FOREIGN KEY(participant_id) REFERENCES participants(id)
  )
`
).run();

export default db;
