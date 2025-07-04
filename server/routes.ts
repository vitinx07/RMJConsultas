import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // CORS middleware for external API calls
  app.use("/api", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Proxy para busca por CPF
  app.post("/api/multicorban/cpf", async (req, res) => {
    try {
      const { apiKey, cpf } = req.body;
      
      const response = await fetch('https://api.multicorban.com/cpf', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: `Erro ao consultar CPF: ${errorText}`,
          status: response.status 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro no proxy CPF:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Proxy para busca por benefício
  app.post("/api/multicorban/offline", async (req, res) => {
    try {
      const { apiKey, beneficio } = req.body;
      
      const response = await fetch('https://api.multicorban.com/offline', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ beneficio }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: `Erro ao consultar benefício: ${errorText}`,
          status: response.status 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Erro no proxy benefício:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
