const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initialiser() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id         SERIAL PRIMARY KEY,
      nom        TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS produits (
      id            SERIAL PRIMARY KEY,
      nom           TEXT    NOT NULL,
      detail        TEXT    DEFAULT '',
      prix          REAL    NOT NULL,
      image_url     TEXT,
      livre         BOOLEAN DEFAULT FALSE,
      collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ajoute les colonnes si elles n'existent pas encore
  await pool.query(`
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS livre BOOLEAN DEFAULT FALSE
  `);
  await pool.query(`
    ALTER TABLE produits ADD COLUMN IF NOT EXISTS collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL
  `);

  console.log("✅ Base de données connectée");
  console.log("✅ Tables prêtes");
}

initialiser().catch(console.error);

module.exports = pool;
