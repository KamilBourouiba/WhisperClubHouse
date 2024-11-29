import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static("public"));
app.use(express.json());

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier téléchargé." });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  const allowedExtensions = [".mp3", ".m4a", ".wav", ".flac"];

  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ error: "Type de fichier invalide." });
  }

  try {
    const audioFileName = `audio_${uuidv4()}${fileExtension}`;
    const tempAudioPath = path.join(uploadDir, audioFileName);
    fs.writeFileSync(tempAudioPath, req.file.buffer);
  
    // Utilisation de l'API OpenAI Whisper pour la transcription en français
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempAudioPath),
      model: "whisper-1",
      language: "fr",
    });
  
    const transcriptionFileName = `${uuidv4()}_transcription.txt`;
    const transcriptionFilePath = path.join('public', 'uploads', transcriptionFileName);
    fs.writeFileSync(transcriptionFilePath, transcription.text);
  
    // Suppression du fichier audio temporaire
    fs.unlinkSync(tempAudioPath);
  
    res.json({ file: `/uploads/${transcriptionFileName}`, transcription: transcription.text });
  } catch (error) {
    console.error("Erreur lors du traitement :", error);
    res.status(500).json({ error: "Erreur lors du traitement : " + error.message });
  }  
});

app.post("/verify-password", (req, res) => {
  const { password } = req.body;
  const correctPassword = process.env.ACCESS_PASSWORD;

  if (password === correctPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.get('/uploads/:file', (req, res) => {
  const file = path.join(__dirname, 'public', 'uploads', req.params.file);
  res.download(file);
});

app.listen(port, () => {
  console.log(`Serveur en fonctionnement sur http://localhost:${port}`);
});
