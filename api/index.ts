import express from "express";
import { registerRoutes } from "../server/routes";

// Create an Express app and register all API routes.
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register routes (returns an http.Server in node usage, which we ignore here)
await registerRoutes(app as any);

// Export a handler compatible with Vercel's Node runtime.
export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}

