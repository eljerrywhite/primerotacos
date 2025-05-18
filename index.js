// index.js
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const mongoose = require("mongoose");

const app  = express();
const port = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✔️ MongoDB conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Esquema y modelo
const taqSchema = new mongoose.Schema({
  nombre:            { type: String, required: true },
  calidad:           { type: Number, required: true, min: 1, max: 5 },
  servicio:          { type: Number, required: true, min: 1, max: 5 },
  lugar:             { type: Number, required: true, min: 1, max: 5 },
  calificacionFinal: { type: Number },
  ubicacion:         { type: String },
  fecha:             { type: Date, default: Date.now },
});
const Taqueria = mongoose.model("Taqueria", taqSchema);

// Ruta raíz
app.get("/", (req, res) => res.send("API de Taquerías OK"));

// Health‐check para UptimeRobot
app.get("/ping", (req, res) => {
  res.send("pong");
});

// GET real
app.get("/taquerias", async (req, res) => {
  try {
    const list = await Taqueria.find().sort({ calificacionFinal: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST real
app.post("/taquerias", async (req, res) => {
  try {
    const { nombre, calidad, servicio, lugar, ubicacion } = req.body;
    const c = Number(calidad), s = Number(servicio), l = Number(lugar);
    const calcFinal = x => Math.round(x * 0.7 + s * 0.2 + l * 0.1);

    let doc = await Taqueria.findOne({ nombre });
    if (doc) {
      const nC = (doc.calidad + c)/2;
      const nS = (doc.servicio + s)/2;
      const nL = (doc.lugar + l)/2;
      doc = await Taqueria.findByIdAndUpdate(
        doc._id,
        { calidad: nC, servicio: nS, lugar: nL, calificacionFinal: calcFinal(nC), ubicacion: ubicacion||doc.ubicacion },
        { new: true }
      );
      return res.json({ mensaje: "Taquería actualizada", taqueria: doc, esActualizacion: true });
    }
    const newDoc = new Taqueria({ nombre, calidad: c, servicio: s, lugar: l, calificacionFinal: calcFinal(c), ubicacion });
    await newDoc.save();
    res.json({ mensaje: "Taquería creada", taqueria: newDoc, esActualizacion: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST real…
app.post("/taquerias", async (req, res) => {
  // …
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`API corriendo en puerto ${port}`);
});

