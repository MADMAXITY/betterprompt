export const config = { runtime: "edge" };

import { ok, badRequest } from "../../_edge";

export default async function handler(req: Request) {
  if ((req.method || "").toUpperCase() !== "POST") return badRequest("Method not allowed");
  return ok({ message: "ok" });
}
