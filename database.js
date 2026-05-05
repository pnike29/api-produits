const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initialiser() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produits (
      id         SERIAL PRIMARY KEY,
      nom        TEXT    NOT NULL,
      detail     TEXT    DEFAULT '',
      prix       REAL    NOT NULL,
      image_url  TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Base de données connectée");
  console.log("✅ Table produits prête");
}

initialiser().catch(console.error);

module.exports = pool;
