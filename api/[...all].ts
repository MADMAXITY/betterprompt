import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

await registerRoutes(app as any);

// Mount the app under /api so requests like /api/prompts hit the registered routes
const handlerApp = express();
handlerApp.use("/api", app);

export default function handler(req: any, res: any) {
  return (handlerApp as any)(req, res);
}
