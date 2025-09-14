import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Only load from local files outside of Vercel or other managed envs
if (!process.env.VERCEL) {
  const root = path.resolve(import.meta.dirname, "..");

  const localEnv = path.resolve(root, ".env.local");
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv, override: false });
  }

  const genericEnv = path.resolve(root, ".env");
  if (fs.existsSync(genericEnv)) {
    dotenv.config({ path: genericEnv, override: false });
  }
}

