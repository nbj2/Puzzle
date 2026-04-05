import { supabase } from "./supabase-client.js";
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
    return sendJson(res, 500, { error: "Missing Supabase configuration" });
  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const emailRaw = url.searchParams.get("email");
  if (!emailRaw || !String(emailRaw).trim())
    return sendJson(res, 400, { error: "email query parameter required" });
  const email = String(emailRaw).trim().toLowerCase();
  const { data, error } = await supabase
    .from("profiles")
    .select("email, name, summary, closing_question")
    .eq("email", email)
    .maybeSingle();
  if (error) return sendJson(res, 500, { error: error.message });
  if (!data) return sendJson(res, 200, { profile: null });
  return sendJson(res, 200, {
    profile: {
      email: data.email,
      name: data.name,
      summary: data.summary,
      closing_question: data.closing_question,
    },
  });
}
