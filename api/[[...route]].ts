import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

await registerRoutes(app as any);

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}

