import { supabase } from "./supabase-client.js";
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    return sendJson(res, 500, { error: "Missing Supabase configuration" });
  let body;
  try { body = await readJsonBody(req); } catch { return sendJson(res, 400, { error: "Invalid JSON body" }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) return sendJson(res, 400, { error: "Valid email required" });
  const row = {
    email,
    name: body.name != null ? String(body.name) : null,
    summary: body.summary != null ? String(body.summary) : null,
    closing_question: body.closing_question != null ? String(body.closing_question) : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("profiles").upsert(row, { onConflict: "email" }).select().single();
  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true, profile: data });
}
