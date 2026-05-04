const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// Configuration upload image
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ── GET tous les produits ──────────────────────────
app.get("/produits", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM produits ORDER BY created_at DESC")
      .all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ── GET un produit ─────────────────────────────────
app.get("/produits/:id", (req, res) => {
  try {
    const row = db
      .prepare("SELECT * FROM produits WHERE id = ?")
      .get(req.params.id);
    if (!row) return res.status(404).json({ erreur: "Produit introuvable" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ── POST créer un produit ──────────────────────────
app.post("/produits", upload.single("image"), (req, res) => {
  try {
    const { nom, detail, prix } = req.body;
    if (!nom || !prix)
      return res.status(400).json({ erreur: "Nom et prix obligatoires" });

    const imageUrl = req.file
      ? `http://localhost:${PORT}/uploads/${req.file.filename}`
      : null;

    const result = db
      .prepare(
        "INSERT INTO produits (nom, detail, prix, image_url) VALUES (?, ?, ?, ?)",
      )
      .run(nom, detail || "", parseFloat(prix), imageUrl);

    const produit = db
      .prepare("SELECT * FROM produits WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(produit);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ── PUT modifier un produit ────────────────────────
app.put("/produits/:id", upload.single("image"), (req, res) => {
  try {
    const { nom, detail, prix } = req.body;
    const produit = db
      .prepare("SELECT * FROM produits WHERE id = ?")
      .get(req.params.id);
    if (!produit)
      return res.status(404).json({ erreur: "Produit introuvable" });

    const imageUrl = req.file
      ? `http://localhost:${PORT}/uploads/${req.file.filename}`
      : produit.image_url;

    db.prepare(
      "UPDATE produits SET nom=?, detail=?, prix=?, image_url=? WHERE id=?",
    ).run(
      nom || produit.nom,
      detail ?? produit.detail,
      parseFloat(prix) || produit.prix,
      imageUrl,
      req.params.id,
    );

    const updated = db
      .prepare("SELECT * FROM produits WHERE id = ?")
      .get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// ── DELETE supprimer un produit ────────────────────
app.delete("/produits/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM produits WHERE id = ?").run(req.params.id);
    res.json({ message: "Produit supprimé ✅" });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
