import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Ayudas Humanitarias Chiminangos" });
  });

  // AI Gemini API Assistant for Humanitarian Aid Analytics & Summaries
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "GEMINI_API_KEY no configurada. Configure la clave API en las opciones del servidor."
        });
      }

      const { prompt, contextData } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
Eres el Asistente Inteligente de Gestión de Ayudas Humanitarias para la comunidad "ENTREGA DE MERCADOS CHIMINANGOS".
Tu función es brindar análisis de cobertura, resúmenes ejecutivos de entregas, sugerencias para optimizar el inventario de insumos, y responder preguntas sobre la población beneficiaria (308 censados) e insumos entregados.

Responde siempre en español, con tono formal, profesional, empático y orientado a la acción social comunitaria.
Utiliza formato estructurado (listas, viñetas, negritas) para facilitar la lectura de los coordinadores y voluntarios de la brigada.
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\n[CONTEXTO ACTUAL DE ENTREGAS E INVENTARIO]\n${JSON.stringify(contextData || {})}\n\n[CONSULTA DEL COORDINADOR]: ${prompt}`
              }
            ]
          }
        ]
      });

      const responseText = response.text || "No se pudo generar respuesta del asistente en este momento.";
      return res.json({ result: responseText });
    } catch (err: any) {
      console.error("Error in AI analysis endpoint:", err);
      return res.status(500).json({ error: err.message || "Error al procesar consulta de IA." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error iniciando el servidor Express:", err);
});
