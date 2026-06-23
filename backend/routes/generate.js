const express = require('express');
const router = express.Router();
const { GoogleGenAI, Type } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/analyze-product', async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
