import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./services/ai-service";
import { insertPromptSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Prompts routes
  app.get("/api/prompts", async (req, res) => {
    try {
      const { category, search, featured } = req.query;
      
      let prompts;
      if (search) {
        prompts = await storage.searchPrompts(search as string);
      } else if (category) {
        prompts = await storage.getPromptsByCategory(category as string);
      } else if (featured === 'true') {
        prompts = await storage.getFeaturedPrompts();
      } else {
        prompts = await storage.getPrompts();
      }
      
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get("/api/prompts/:id", async (req, res) => {
    try {
      const prompt = await storage.getPromptById(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      // Increment view count
      await storage.incrementPromptViews(req.params.id);
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prompt" });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      const validatedData = insertPromptSchema.parse(req.body);
      const prompt = await storage.createPrompt(validatedData);
      res.status(201).json(prompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create prompt" });
      }
    }
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    try {
      const updates = insertPromptSchema.partial().parse(req.body);
      const prompt = await storage.updatePrompt(req.params.id, updates);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      res.json(prompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update prompt" });
      }
    }
  });

  app.post("/api/prompts/:id/like", async (req, res) => {
    try {
      await storage.incrementPromptLikes(req.params.id);
      res.json({ message: "Prompt liked successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to like prompt" });
    }
  });

  // AI generation routes
  app.post("/api/ai/generate-prompt", async (req, res) => {
    try {
      const schema = z.object({
        goal: z.string().min(1, "Goal is required"),
        category: z.string().optional(),
        audience: z.string().optional(),
        tone: z.string().optional(),
        additionalContext: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      const result = await aiService.generatePrompt(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to generate prompt", 
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  app.post("/api/ai/refine-prompt", async (req, res) => {
    try {
      const schema = z.object({
        originalPrompt: z.string().min(1, "Original prompt is required"),
        refinementGoal: z.string().min(1, "Refinement goal is required")
      });

      const validatedData = schema.parse(req.body);
      const result = await aiService.refinePrompt(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to refine prompt", 
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  app.post("/api/ai/suggest-improvements", async (req, res) => {
    try {
      const schema = z.object({
        prompt: z.string().min(1, "Prompt is required")
      });

      const validatedData = schema.parse(req.body);
      const suggestions = await aiService.generatePromptSuggestions(validatedData.prompt);
      res.json({ suggestions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ 
          message: "Failed to generate suggestions", 
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Saved prompts routes (for future user system)
  app.get("/api/saved-prompts/:userId", async (req, res) => {
    try {
      const prompts = await storage.getSavedPrompts(req.params.userId);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved prompts" });
    }
  });

  app.post("/api/saved-prompts", async (req, res) => {
    try {
      const schema = z.object({
        promptId: z.string(),
        userId: z.string()
      });

      const validatedData = schema.parse(req.body);
      const savedPrompt = await storage.savePrompt(validatedData);
      res.status(201).json(savedPrompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save prompt" });
      }
    }
  });

  app.delete("/api/saved-prompts/:promptId/:userId", async (req, res) => {
    try {
      await storage.unsavePrompt(req.params.promptId, req.params.userId);
      res.json({ message: "Prompt unsaved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unsave prompt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
