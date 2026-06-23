import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Gemini API Proxy Routes
  app.get("/api/gemini-health", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ status: "error", message: "GEMINI_API_KEY missing" });
    }
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.countTokens({ contents: 'ping' });
      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(503).json({ status: "error", message: "Gemini API unavailable or invalid key" });
    }
  });

  app.post("/api/analyze-product", async (req, res) => {
    const { imageBase64, mimeType } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { 
          parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType || 'image/png' } },
            { text: "SYSTEM: PRODUCT-INTELLIGENT AI. Analyze this product for high-fidelity e-commerce rendering. Focus on material texture, finish, and details. Output JSON format only." }
          ] 
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              brand: { type: Type.STRING },
              material: { type: Type.STRING },
              colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
              features: { type: Type.ARRAY, items: { type: Type.STRING } },
              visualFidelityKeys: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["type", "brand", "material", "colorPalette", "features", "visualFidelityKeys"]
          }
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
