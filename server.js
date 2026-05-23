const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const pool = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "produits",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  },
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════
// ROUTES COLLECTIONS
// ══════════════════════════════════════════

app.get("/collections", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM collections ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.post("/collections", async (req, res) => {
  try {
    const { nom } = req.body;
    if (!nom) return res.status(400).json({ erreur: "Nom obligatoire" });
    const result = await pool.query(
      "INSERT INTO collections (nom) VALUES ($1) RETURNING *",
      [nom],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.delete("/collections/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM collections WHERE id = $1", [req.params.id]);
    res.json({ message: "Collection supprimée ✅" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ══════════════════════════════════════════
// ROUTES PRODUITS
// ══════════════════════════════════════════

app.get("/produits", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nom as collection_nom
      FROM produits p
      LEFT JOIN collections c ON p.collection_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.get("/produits/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT p.*, c.nom as collection_nom
      FROM produits p
      LEFT JOIN collections c ON p.collection_id = c.id
      WHERE p.id = $1
    `,
      [req.params.id],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ erreur: "Produit introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.post("/produits", upload.single("image"), async (req, res) => {
  try {
    const { nom, detail, prix, collection_id } = req.body;
    if (!nom || !prix)
      return res.status(400).json({ erreur: "Nom et prix obligatoires" });

    const imageUrl = req.file
      ? req.file.path.replace("http://", "https://")
      : null;

    const result = await pool.query(
      "INSERT INTO produits (nom, detail, prix, image_url, collection_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nom, detail || "", parseFloat(prix), imageUrl, collection_id || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.put("/produits/:id", upload.single("image"), async (req, res) => {
  try {
    const { nom, detail, prix, collection_id } = req.body;
    const existant = await pool.query("SELECT * FROM produits WHERE id = $1", [
      req.params.id,
    ]);
    if (existant.rows.length === 0)
      return res.status(404).json({ erreur: "Produit introuvable" });

    const produit = existant.rows[0];
    const imageUrl = req.file
      ? req.file.path.replace("http://", "https://")
      : produit.image_url;

    const result = await pool.query(
      "UPDATE produits SET nom=$1, detail=$2, prix=$3, image_url=$4, collection_id=$5 WHERE id=$6 RETURNING *",
      [
        nom || produit.nom,
        detail ?? produit.detail,
        parseFloat(prix) || produit.prix,
        imageUrl,
        collection_id || produit.collection_id,
        req.params.id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// PATCH statut livré
app.patch("/produits/:id/livre", async (req, res) => {
  try {
    const { livre } = req.body;
    const result = await pool.query(
      "UPDATE produits SET livre=$1 WHERE id=$2 RETURNING *",
      [livre, req.params.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.delete("/produits/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM produits WHERE id = $1", [req.params.id]);
    res.json({ message: "Produit supprimé ✅" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
