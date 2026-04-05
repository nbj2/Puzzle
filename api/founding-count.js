import { supabase } from "./supabase-client.js";
const TABLE = "founding_count";
const ROW_ID = 1;
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}
export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return sendJson(res, 500, { error: "Missing Supabase configuration" });
  }
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from(TABLE).select("count").eq("id", ROW_ID).maybeSingle();
    if (error) return sendJson(res, 500, { error: error.message });
    return sendJson(res, 200, { count: data?.count ?? 0 });
  }
  if (req.method === "POST") {
    const { data: existing, error: readErr } = await supabase
      .from(TABLE).select("count").eq("id", ROW_ID).maybeSingle();
    if (readErr) return sendJson(res, 500, { error: readErr.message });
    if (!existing) {
      const { data: inserted, error: insertErr } = await supabase
        .from(TABLE).insert({ id: ROW_ID, count: 1 }).select("count").single();
      if (insertErr) return sendJson(res, 500, { error: insertErr.message });
      return sendJson(res, 200, { count: inserted.count });
    }
    const newCount = existing.count + 1;
    const { data: updated, error: updateErr } = await supabase
      .from(TABLE).update({ count: newCount }).eq("id", ROW_ID).select("count").single();
    if (updateErr) return sendJson(res, 500, { error: updateErr.message });
    return sendJson(res, 200, { count: updated.count });
  }
  res.statusCode = 405;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
