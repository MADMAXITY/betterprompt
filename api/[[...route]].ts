import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

await registerRoutes(app as any);

export default function handler(req: any, res: any) {
  // Normalize path so Express routes defined as /api/* match regardless of how Vercel passes the path
  if (!req.url.startsWith("/api/")) {
    const rest = req.url.startsWith("/") ? req.url : `/${req.url}`;
    req.url = `/api${rest}`;
  }
  return (app as any)(req, res);
}
