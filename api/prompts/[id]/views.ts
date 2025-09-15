export const config = { runtime: "nodejs" };

import type { IncomingMessage, ServerResponse } from "http";
import { ok, badRequest } from "../../_util";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest(res, "Method not allowed");
  return ok(res, { message: "ok" });
}

