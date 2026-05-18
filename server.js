const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const pool = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Stockage images sur Cloudinary
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

// GET tous les produits
app.get("/produits", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM produits ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// GET un produit
app.get("/produits/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produits WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ erreur: "Produit introuvable" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// POST créer un produit
app.post("/produits", upload.single("image"), async (req, res) => {
  try {
    const { nom, detail, prix } = req.body;
    if (!nom || !prix)
      return res.status(400).json({ erreur: "Nom et prix obligatoires" });

    const imageUrl = req.file
      ? req.file.path.replace("http://", "https://")
      : null;

    const result = await pool.query(
      "INSERT INTO produits (nom, detail, prix, image_url) VALUES ($1, $2, $3, $4) RETURNING *",
      [nom, detail || "", parseFloat(prix), imageUrl],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// PUT modifier un produit
app.put("/produits/:id", upload.single("image"), async (req, res) => {
  try {
    const { nom, detail, prix } = req.body;
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
      "UPDATE produits SET nom=$1, detail=$2, prix=$3, image_url=$4 WHERE id=$5 RETURNING *",
      [
        nom || produit.nom,
        detail ?? produit.detail,
        parseFloat(prix) || produit.prix,
        imageUrl,
        req.params.id,
      ],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// DELETE supprimer un produit
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
