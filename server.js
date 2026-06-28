import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const IMAGES_DIR = process.env.IMAGES_DIR;

// Permitir el acceso a la API desde el frontend
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET"],
  })
);

// Sirve los archivos estáticos
app.use("/imagenes", express.static(IMAGES_DIR));

app.listen(PORT, () => {
  console.log(
    `Servidor de imágenes corriendo en http://localhost:${PORT}/imagenes`
  );
});
