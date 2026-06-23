import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { ProductAnalysis, BrandKit, ShootConfig, ModelPersona, ProductDetails, LuxuryStyle, CameraAngle, CameraMotion, ProductCategory, AmazonListingSuite } from "../types";

const SAFETY_BLOCKLIST = [
  'naked', 'nude', 'lingerie', 'underwear', 'bikini', 'swimsuit', 'explicit', 
  'erotic', 'sexual', 'porn', 'see-through', 'nsfw', 'reveal', 'chest', 'groin',
  'short skirt', 'mini skirt', 'crop top', 'strapless', 'backless'
];

const MODESTY_SYSTEM_INSTRUCTION = `
MODESTY & REFINEMENT STANDARD:
Always render human models as attractive, well-presented, and modest. 
Clothing must be respectful, with covered shoulders and legs, no transparent or skin-tight garments, and no explicit or suggestive styling.
Ensure diversity across regions, skin tones, and body types while keeping every look within a refined, luxury and modest fashion standard. 
Avoid sexualized poses, exaggerated body features, or provocative expressions.
`;

const PRODUCT_LOCK_PROTOCOL = `
[SYSTEM PROMPT - PRODUCT FIDELITY LOCK]:
Use the uploaded product image as the ABSOLUTE SINGLE SOURCE OF TRUTH. 
DO NOT ALTER, REDESIGN, OR SIMPLIFY ANY PRODUCT DETAILS. 
Preserve exact colors (hex/RGB), fabric textures, material weight, prints, embroidery patterns, beadwork, lace details, logos, and silhouette. 
IGNORE any human or background in the original reference—extract the product only.
`;

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      console.warn(`API call failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }

  private static cleanBase64(b64: string): string {
    if (!b64) return "";
    return b64.includes(",") ? b64.split(",")[1].trim() : b64.trim();
  }

  private static validatePrompt(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    return !SAFETY_BLOCKLIST.some(term => lower.includes(term));
  }

  private static async urlToBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url).catch(() => null);
      if (!response || !response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(this.cleanBase64(res));
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  }

  private static buildFidelityPrompt(userPrompt: string, analysis: ProductAnalysis, productDetails: ProductDetails, brandKit: BrandKit, modelContext: string = ""): string {
    const isProductOnly = productDetails.renderMode === 'product-only';
    const analysisKeys = `PRESERVE KEYS: Type: ${analysis.type}, Material: ${analysis.material}, Color Palette: ${analysis.colorPalette.join(', ')}, Key Features: ${analysis.features.join(', ')}.`;
    const cameraContext = productDetails.cameraAngle ? `Camera Perspective: ${productDetails.cameraAngle}.` : "";

    return `
${PRODUCT_LOCK_PROTOCOL}
${isProductOnly ? 'MODE: PRODUCT ONLY. NO HUMANS.' : MODESTY_SYSTEM_INSTRUCTION}

[SCENE PROMPT]:
${userPrompt}. 
${cameraContext}
Adjust only environment and lighting. 
${modelContext}
Maison Visual Tone: ${brandKit.tone}.

[PRODUCT PRESERVE PROMPT]:
Copy the product EXACTLY from the reference image. 
${analysisKeys}
Preserve exact fabric weave, stitch patterns, 3D floral/lace details, and metallic reflections. 
No hallucinated design elements. 
Branding: ${productDetails.addLogo ? `Apply Maison logo exactly at ${productDetails.logoPlacement}.` : 'Preserve existing branding from reference.'}
`;
  }

  static async generateFastDraft(
    imageBase64: string,
    brandKit: BrandKit,
    mood: string
  ): Promise<string> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const cleanB64 = this.cleanBase64(imageBase64);
      
      // Optimized prompt for speed
      const prompt = `Quickly generate a draft visual of this product in ${mood} mood for ${brandKit.name}. Maintain strict fidelity to the product.`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { 
          parts: [
            { inlineData: { data: cleanB64, mimeType: 'image/png' } },
            { text: prompt }
          ] 
        }
      });
      
      const part = response.candidates[0].content.parts.find(p => p.inlineData);
      if (part) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Draft failed.");
    });
  }

  static async analyzeProduct(imageBase64: string, mimeType: string, brandKit?: BrandKit): Promise<ProductAnalysis> {
    const response = await fetch('/api/analyze-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: this.cleanBase64(imageBase64), mimeType })
    });
    if (!response.ok) throw new Error('Analysis failed.');
    return response.json();
  }

  static async suggestPhotoshootPrompts(imageBase64: string, brandKit: BrandKit, analysis?: ProductAnalysis): Promise<{label: string, prompt: string}[]> {
    return this.withRetry(async () => {
        const ai = this.getAi();
        const cleanB64 = this.cleanBase64(imageBase64);
        
        const contextStr = analysis ? `
          PRODUCT DNA:
          Type: ${analysis.type}
          Material: ${analysis.material}
          Features: ${analysis.features.join(', ')}
          Colors: ${analysis.colorPalette.join(', ')}
        ` : "";

        const prompt = `
          SYSTEM: CREATIVE DIRECTOR for AMRAH Luxury Maison.
          TASK: Generate 10 distinct, high-fidelity creative concepts for a photoshoot based on the provided product image and DNA.
          
          PRODUCT CONTEXT:
          ${contextStr}
          Maison Brand: ${brandKit.name}
          Maison Tone: ${brandKit.tone}

          DIRECTIVES:
          - Prompts must be technical, descriptive, and optimized for high-end AI rendering.
          - Each prompt should explicitly mention how lighting interacts with the ${analysis?.material || 'product materials'}.
          - Mandatory Aesthetics to include:
            1. "Editorial Minimalist" (Pure white or grey backdrops, soft shadows, high-end simplicity).
            2. "Opulent Arabian Heritage" (Intricate textures, warm gold lighting, marble, arches, desert luxury).
            3. "Cinematic Golden Hour" (Warm, high-contrast, directional sun lighting).
            4. "Urban Modernity" (Sleek architectural backgrounds, Dubai skyline silhouettes).
            5. "Studio Noir" (Dark, moody, spotlight focused, high contrast).
            6. "Nature Sanctuary" (Organic elements like stone, linen, soft diffused daylight).
          
          Output 10 concepts in JSON array format: [{label: "Short Name", prompt: "Full Prompt"}].
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { 
            parts: [
              { inlineData: { data: cleanB64, mimeType: 'image/png' } },
              { text: prompt }
            ] 
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  prompt: { type: Type.STRING }
                },
                required: ["label", "prompt"]
              }
            }
          }
        });
        return JSON.parse(response.text || '[]');
    });
  }

  static async generatePhotoshoot(
    config: ShootConfig,
    brandKit: BrandKit,
    type: 'image' | 'video' = 'image',
    onStatus: (msg: string) => void
  ): Promise<string> {
    const cleanProductB64 = this.cleanBase64(config.productImage);
    const analysis = await this.analyzeProduct(cleanProductB64, 'image/png', brandKit);
    
    if (type === 'image') {
      return this.withRetry(async () => {
        const ai = this.getAi();
        const parts: any[] = [
          { inlineData: { data: cleanProductB64, mimeType: 'image/png' } },
          { text: "REFERENCE" }
        ];

        let modelContext = "";
        if (config.model) {
          const modelBase64 = await this.urlToBase64(config.model.mainUrl);
          if (modelBase64) {
            parts.push({ inlineData: { data: modelBase64, mimeType: 'image/png' } }, { text: "MODEL" });
          }
          modelContext = `Model Identity: ${config.model.name}.`;
        }

        const finalStructuredPrompt = this.buildFidelityPrompt(config.useCase, analysis, config.productDetails, brandKit, modelContext);
        parts.push({ text: finalStructuredPrompt });

        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: { parts },
          config: { imageConfig: { aspectRatio: '3:4' } }
        });
        
        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part) return `data:image/png;base64,${part.inlineData.data}`;
        throw new Error("Generation failed.");
      });
    } else {
      return this.withRetry(async () => {
        onStatus("Initializing Motion...");
        const ai = this.getAi();
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: config.useCase,
          image: { imageBytes: cleanProductB64, mimeType: 'image/png' },
          config: { 
            numberOfVideos: 1, 
            resolution: config.productDetails.videoResolution || '720p', 
            aspectRatio: config.productDetails.videoAspectRatio || '16:9' 
          }
        });

        while (!operation.done) {
          onStatus("Synthesizing frames...");
          await new Promise(r => setTimeout(r, 10000));
          operation = await this.getAi().operations.getVideosOperation({ operation: operation });
        }

        const link = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (link) {
          const res = await fetch(`${link}&key=${process.env.API_KEY}`);
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        }
        throw new Error("Video failed.");
      });
    }
  }

  static async generateProductImage(
    baseImage: string, 
    analysis: ProductAnalysis, 
    customPrompt: string,
    brandKit: BrandKit,
    productDetails: ProductDetails,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
  ): Promise<string> {
    const ai = this.getAi();
    const cleanBaseB64 = this.cleanBase64(baseImage);
    const finalStructuredPrompt = this.buildFidelityPrompt(customPrompt, analysis, productDetails, brandKit);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: { 
        parts: [
          { inlineData: { data: cleanBaseB64, mimeType: 'image/png' } },
          { text: finalStructuredPrompt }
        ] 
      },
      config: { imageConfig: { aspectRatio } }
    });

    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Render failed.");
  }

  static async generateCampaignAsset(
    prompt: string,
    productB64s: (string | null)[],
    brandKit: BrandKit,
    productDetails: ProductDetails,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9",
    imageSize: "1K" | "2K" | "4K" = "1K"
  ): Promise<string> {
    const ai = this.getAi();
    const firstProductB64 = this.cleanBase64(productB64s[0]!);
    const analysis = await this.analyzeProduct(firstProductB64, 'image/png', brandKit);
    const finalStructuredPrompt = this.buildFidelityPrompt(prompt, analysis, productDetails, brandKit);
    
    const parts: any[] = productB64s.filter(b => b).map(b => ({ inlineData: { data: this.cleanBase64(b!), mimeType: 'image/png' } }));
    parts.push({ text: finalStructuredPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio, imageSize } }
    });
    
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Campaign failed.");
  }

  static async generateProductVideo(
    base64: string, 
    analysis: ProductAnalysis, 
    prompt: string, 
    brandKit: BrandKit, 
    productDetails: ProductDetails,
    onStatus: (msg: string) => void
  ): Promise<string> {
    const cleanB64 = this.cleanBase64(base64);
    const ai = this.getAi();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      image: { imageBytes: cleanB64, mimeType: 'image/png' },
      config: { 
        numberOfVideos: 1, 
        resolution: productDetails.videoResolution || '720p', 
        aspectRatio: productDetails.videoAspectRatio || '16:9' 
      }
    });

    while (!operation.done) {
      onStatus("Synthesizing motion...");
      await new Promise(r => setTimeout(r, 10000));
      operation = await this.getAi().operations.getVideosOperation({ operation: operation });
    }

    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (link) {
      const res = await fetch(`${link}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
    throw new Error("Video synthesis failed.");
  }

  static async generateAmazonListingSuitePrompts(activeImages: { b64: string, mimeType: string, role: string }[]): Promise<AmazonListingSuite> {
    const ai = this.getAi();
    const parts: any[] = activeImages.map(img => ({ inlineData: { data: this.cleanBase64(img.b64), mimeType: img.mimeType || 'image/png' } }));
    parts.push({ text: `SYSTEM: AMAZON STRATEGIST. Analyze product and create 9 listing prompts. JSON output.` });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            listing_metadata: {
              type: Type.OBJECT,
              properties: {
                product_identified: { type: Type.STRING },
                primary_materials: { type: Type.STRING },
                brand_color_palette: { type: Type.STRING }
              }
            },
            amazon_suite: {
              type: Type.OBJECT,
              properties: {
                slot_1_main: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_2_dimensions: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_3_isometric: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_4_back_view: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_5_material_detail: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_6_lifestyle_1: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_7_lifestyle_2: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_8_infographic: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } },
                slot_9_brand_trust: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING }, type: { type: Type.STRING } } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  static async suggestCampaignStories(imageBase64: string, brandKit: BrandKit): Promise<{label: string, prompt: string}[]> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const prompt = `SYSTEM: CAMPAIGN STRATEGIST AI. Analyze product for campaign narratives. Maison Tone: ${brandKit.tone}. Generate 4 campaign concepts. JSON array output.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
          { text: prompt }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              prompt: { type: Type.STRING }
            },
            required: ["label", "prompt"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }

  static async editProductImage(imageSource: string, analysis: ProductAnalysis, prompt: string, brandKit: BrandKit): Promise<string> {
    const ai = this.getAi();
    let cleanB64 = "";
    if (imageSource.startsWith('data:')) {
      cleanB64 = this.cleanBase64(imageSource);
    } else if (imageSource.startsWith('http')) {
      cleanB64 = await this.urlToBase64(imageSource) || "";
    } else {
      cleanB64 = this.cleanBase64(imageSource);
    }

    const finalStructuredPrompt = `
${PRODUCT_LOCK_PROTOCOL}
${MODESTY_SYSTEM_INSTRUCTION}

[NEURAL REFINEMENT DIRECTIVE]:
${prompt}.

[PRODUCT FIDELITY PRESERVATION]:
Maison Product DNA: ${analysis.type}, ${analysis.material}. 
Visual Keys: ${analysis.visualFidelityKeys.join(', ')}.
DO NOT change the core structure of the product. ONLY add requested embellishments or background transformations.
`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
          { text: finalStructuredPrompt }
        ]
      }
    });
    
    const part = response.candidates[0].content.parts.find(p => p.inlineData);
    if (part) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("Neural edit failed.");
  }

  static async trainPersonalModel(dataset: string[]): Promise<string> {
    return "identity-" + Math.random().toString(36).substr(2, 9);
  }

  static async generatePhotoshootBrief(imageBase64: string, mimeType: string, userBrief: string, brandKit: BrandKit, model?: ModelPersona | null): Promise<string> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    const modelContext = model ? `Selected Model identity: ${model.name}, features: ${model.features}.` : "No specific model casting.";
    const prompt = `SYSTEM: LUXURY PHOTOSHOOT PLANNER. Analyze product and user vision. Maison Tone: ${brandKit.tone}. ${modelContext} User Vision: ${userBrief}. Generate a professional production plan and a detailed technical AI GENERATION BRIEF.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: mimeType || 'image/png' } },
          { text: prompt }
        ] 
      }
    });
    return response.text || "Assistant brief synthesis failed.";
  }

  static async generatePromotionalStoryboard(
    imageBase64: string,
    productName: string,
    brandKit: BrandKit
  ): Promise<{
    productName: string;
    vibe: string;
    musicVibe: string;
    colorScheme: string;
    scenes: {
      id: number;
      duration: number;
      cameraAngle: string;
      cameraMotion: string;
      textOverlay: string;
      overlayPlacement: string;
      visualBrief: string;
    }[];
  }> {
    const ai = this.getAi();
    const cleanB64 = this.cleanBase64(imageBase64);
    
    const prompt = `
      SYSTEM: EXECUTIVE CREATIVE DIRECTOR for AMRAH Luxury Maison.
      TASK: Generate a high-end, 12-second promotional commercial storyboard consisting of exactly 3 cinematic scenes (4 seconds each) for a product.
      
      Maison Brand: ${brandKit.name}
      Maison Tone: ${brandKit.tone}
      Product Identified or Provided Name: "${productName || 'Luxury Product'}"

      DIRECTIVES:
      - Create 3 cohesive, flowing scene descriptions representing the "Introduction", the "Detail Reveal", and the "Call to Action".
      - The storyboard should feel incredibly luxurious, elegant, and editorial.
      - For each scene, specify unique:
        - cameraAngle: One of ['Standard', 'Low Angle', 'High Angle', 'Bird\\'s Eye', 'Side', 'Close-up']
        - cameraMotion: One of ['Orbit', 'Zoom In', 'Zoom Out', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down']
        - textOverlay: A short, compelling marketing caption (max 5 words) that acts as a typography layer.
        - overlayPlacement: One of ['Top-Center', 'Center-Left', 'Bottom-Center', 'Right-Sidebar']
        - visualBrief: A highly detailed descriptive prompt (text generation instructions, e.g. "Detailed macro shot of the watch gold bezel, warm sunlight reflecting, luxury leather background")
      - Also output a general 'vibe' style name, standard luxury 'colorScheme' suggestion, and a 'musicVibe' (e.g. "Ambient neoromanic oud playing softly, subtle high-fashion click beats").

      Output exactly JSON format with the following schema:
      {
        "productName": "string",
        "vibe": "string",
        "musicVibe": "string",
        "colorScheme": "string",
        "scenes": [
          {
            "id": 1,
            "duration": 4,
            "cameraAngle": "string",
            "cameraMotion": "string",
            "textOverlay": "string",
            "overlayPlacement": "string",
            "visualBrief": "string"
          },
          ... exactly 3 elements ...
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { 
        parts: [
          { inlineData: { data: cleanB64, mimeType: 'image/png' } },
          { text: prompt }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            vibe: { type: Type.STRING },
            musicVibe: { type: Type.STRING },
            colorScheme: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  duration: { type: Type.INTEGER },
                  cameraAngle: { type: Type.STRING },
                  cameraMotion: { type: Type.STRING },
                  textOverlay: { type: Type.STRING },
                  overlayPlacement: { type: Type.STRING },
                  visualBrief: { type: Type.STRING }
                },
                required: ["id", "duration", "cameraAngle", "cameraMotion", "textOverlay", "overlayPlacement", "visualBrief"]
              }
            }
          },
          required: ["productName", "vibe", "musicVibe", "colorScheme", "scenes"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  static async generateProductionBrief(
    productName: string,
    brandKit: BrandKit,
    campaignType: 'reel' | 'tvc',
    models: string[],
    additionalNotes: string = ""
  ): Promise<{
    agentPlanner: {
      shootSchedule: string[];
      locationRecommendation: string;
      equipmentSpec: string;
      budgetTips: string;
    };
    creativeDirector: {
      treatment: string;
      lightingVibe: string;
      stylingCostume: string;
      musicVibe: string;
    };
    storyboardApplied: {
      s1Text: string;
      s1Motion: string;
      s1Brief: string;
      s2Text: string;
      s2Motion: string;
      s2Brief: string;
      s3Text: string;
      s3Motion: string;
      s3Brief: string;
    }
  }> {
    const ai = this.getAi();
    const prompt = `
      SYSTEM: CHIEF PRODUCTION PLANNER & CREATIVE DIRECTOR Collaboration Board for ${brandKit.name || 'AMRAH Luxury Maison'}.
      TASK: Generate a high-quality TVC/Reel Creative Production Brief and a coordinated 3-scene Storyboard script matching these parameters:
      
      - Product Name: "${productName || 'Maison Piece'}"
      - Campaign Category of format: "${campaignType === 'reel' ? 'Social Reel / TikTok Short (9:16)' : 'Cinema TV Commercial (16:9)'}"
      - Cast Members Selected: ${models.length > 0 ? models.join(', ') : 'No specific models assigned (default to elegant Arabian signature Cast)'}
      - Custom Directives / Tone Notes of user: "${additionalNotes}"
      - Brand Tone Aesthetic: "${brandKit.tone || 'Opulent'}"

      DIRECTIVES:
      1. AGENT PLANNER SECTION:
         - Provide a shootSchedule as an array of 3 distinct, practical production checklist steps (Pre-Production Casting, Production Day, Post-Production Mastering).
         - Suggest some high-end luxury locations (specific premium spots in UAE/Saudi e.g. "Al Seef Heritage Area", "desert dunes of Al Maha luxury resort", "luxurious penthouse overlook Dubai Marina", "sleek marble gallery").
         - Recommend professional camera equipment specifications.
         - Suggest key tips for budget optimization.

      2. CREATIVE DIRECTOR SECTION:
         - Write an inspiring, poetic "treatment" summarizing the campaign's visual mood, rhythm, and narrative message.
         - Direct detailed "lightingVibe" (with temperature and lux notes, e.g. "Warm sunset backlight 2800K, soft gold reflections").
         - Suggest costume styling directions that coordinate with the brand's luxury codes.
         - Outline precise musical design.

      3. COORDINATED STORYBOARD SCRIPT:
         - Provide exact, high-impact marketing captions (s1Text, s2Text, s3Text) of maximum 5 words each, in uppercase.
         - Specify camera motion presets (s1Motion, s2Motion, s3Motion) from ['Orbit', 'Zoom In', 'Zoom Out', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down'].
         - Write extremely detailed generative prompt briefs (s1Brief, s2Brief, s3Brief) detailing character gait, wind-blown silks, facial micro-expressions, clothing textures, and exact model staging so they walk and act with high quality and consistent identity locking. Ensure descriptions mention: "symmetrical features, 4k detail, movie style, consistent with ${models[0] || 'designated talent'} model look".

      All outputs must feel of extreme premium quality & professional caliber suitable for a world-class luxury brand.
      
      Output exactly in JSON layout matching this structure:
      {
        "agentPlanner": {
          "shootSchedule": ["string", "string", "string"],
          "locationRecommendation": "string",
          "equipmentSpec": "string",
          "budgetTips": "string"
        },
        "creativeDirector": {
          "treatment": "string",
          "lightingVibe": "string",
          "stylingCostume": "string",
          "musicVibe": "string"
        },
        "storyboardApplied": {
          "s1Text": "string",
          "s1Motion": "string",
          "s1Brief": "string",
          "s2Text": "string",
          "s2Motion": "string",
          "s2Brief": "string",
          "s3Text": "string",
          "s3Motion": "string",
          "s3Brief": "string"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agentPlanner: {
              type: Type.OBJECT,
              properties: {
                shootSchedule: { type: Type.ARRAY, items: { type: Type.STRING } },
                locationRecommendation: { type: Type.STRING },
                equipmentSpec: { type: Type.STRING },
                budgetTips: { type: Type.STRING }
              },
              required: ["shootSchedule", "locationRecommendation", "equipmentSpec", "budgetTips"]
            },
            creativeDirector: {
              type: Type.OBJECT,
              properties: {
                treatment: { type: Type.STRING },
                lightingVibe: { type: Type.STRING },
                stylingCostume: { type: Type.STRING },
                musicVibe: { type: Type.STRING }
              },
              required: ["treatment", "lightingVibe", "stylingCostume", "musicVibe"]
            },
            storyboardApplied: {
              type: Type.OBJECT,
              properties: {
                s1Text: { type: Type.STRING },
                s1Motion: { type: Type.STRING },
                s1Brief: { type: Type.STRING },
                s2Text: { type: Type.STRING },
                s2Motion: { type: Type.STRING },
                s2Brief: { type: Type.STRING },
                s3Text: { type: Type.STRING },
                s3Motion: { type: Type.STRING },
                s3Brief: { type: Type.STRING }
              },
              required: [
                "s1Text", "s1Motion", "s1Brief",
                "s2Text", "s1Motion", "s2Brief",
                "s3Text", "s3Motion", "s3Brief"
              ]
            }
          },
          required: ["agentPlanner", "creativeDirector", "storyboardApplied"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  static async generateCgiVideo(
    base64: string | null,
    prompt: string,
    aspectRatio: string = '16:9',
    resolution: string = '720p',
    onStatus: (msg: string) => void
  ): Promise<string> {
    const ai = this.getAi();
    const config: any = {
      numberOfVideos: 1,
      resolution: resolution || '720p',
      aspectRatio: aspectRatio || '16:9'
    };
    
    // We set up the Veo-3.1 video generation request
    const requestPayload: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: config
    };

    if (base64) {
      requestPayload.image = { imageBytes: this.cleanBase64(base64), mimeType: 'image/png' };
    }

    let operation = await ai.models.generateVideos(requestPayload);

    while (!operation.done) {
      onStatus("Calculating particles & ray-traced shadows...");
      await new Promise(r => setTimeout(r, 10000));
      operation = await this.getAi().operations.getVideosOperation({ operation: operation });
    }

    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (link) {
      const res = await fetch(`${link}&key=${process.env.API_KEY}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
    throw new Error("CGI neural simulation failed to output video stream.");
  }
}