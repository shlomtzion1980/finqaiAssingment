import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS profiles (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    first_name        TEXT NOT NULL,
    last_name         TEXT NOT NULL,
    gender            TEXT NOT NULL,
    email             TEXT NOT NULL,
    phone             TEXT NOT NULL,
    dob               TEXT NOT NULL,
    street_number     INTEGER NOT NULL,
    street_name       TEXT NOT NULL,
    city              TEXT NOT NULL,
    state             TEXT NOT NULL,
    country           TEXT NOT NULL,
    picture_large     TEXT NOT NULL,
    picture_thumbnail TEXT NOT NULL,
    saved_at          TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  ) STRICT;
`;

/** Opens (or creates) the database and applies the schema. Pass ':memory:' for tests. */
export function openDatabase(file: string): Database.Database {
  if (file !== ':memory:') {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}
