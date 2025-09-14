import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// On Vercel, this catch-all function may receive paths like "/prompts".
// Our Express routes are registered under "/api/*". Normalize to include the prefix.
app.use((req, _res, next) => {
  if (!req.url.startsWith("/api/")) {
    req.url = req.url.startsWith("/") ? `/api${req.url}` : `/api/${req.url}`;
  }
  next();
});

await registerRoutes(app as any);

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
