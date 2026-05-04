const Database = require("better-sqlite3");

const db = new Database("./produits.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS produits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nom        TEXT    NOT NULL,
    detail     TEXT    DEFAULT '',
    prix       REAL    NOT NULL,
    image_url  TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✅ Base de données connectée");
console.log("✅ Table produits prête");

module.exports = db;
