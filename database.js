import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');

const sqlite = new DatabaseSync(dbPath);

const db = {
  run(sql, params = [], callback) {
    const cb = typeof params === 'function' ? params : callback;
    const bindParams = Array.isArray(params) ? params : [];
    try {
      const stmt = sqlite.prepare(sql);
      const result = stmt.run(...bindParams);
      if (cb) {
        cb.call({ lastID: Number(result.lastInsertRowid), changes: result.changes }, null);
      }
    } catch (err) {
      if (cb) cb.call({}, err);
    }
  },
  get(sql, params = [], callback) {
    const cb = typeof params === 'function' ? params : callback;
    const bindParams = Array.isArray(params) ? params : [];
    try {
      const stmt = sqlite.prepare(sql);
      const row = stmt.get(...bindParams);
      if (cb) cb(null, row);
    } catch (err) {
      if (cb) cb(err, null);
    }
  },
  all(sql, params = [], callback) {
    const cb = typeof params === 'function' ? params : callback;
    const bindParams = Array.isArray(params) ? params : [];
    try {
      const stmt = sqlite.prepare(sql);
      const rows = stmt.all(...bindParams);
      if (cb) cb(null, rows);
    } catch (err) {
      if (cb) cb(err, null);
    }
  }
};

db.run(`
  CREATE TABLE IF NOT EXISTS livros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    isbn TEXT,
    ano INTEGER,
    genero TEXT,
    status TEXT NOT NULL DEFAULT 'Quero ler'
  )
`);

console.log('Conectado ao banco SQLite (database.sqlite) - Sistema de Gerenciamento de Livros.');

export default db;
