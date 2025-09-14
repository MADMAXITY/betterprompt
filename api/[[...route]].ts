import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

await registerRoutes(app as any);

// Mount Express app under /api so that incoming /api/* paths hit the registered /api routes
const handlerApp = express();
handlerApp.use("/api", app);

export default function handler(req: any, res: any) {
  return (handlerApp as any)(req, res);
}
