import axios from "axios";
import { config } from "../config.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM = `You are an enterprise healthcare operations assistant. Analyze the email and respond with ONLY a single JSON object (no markdown fences) with these keys:
- actionable: boolean — whether this email requires operational follow-up
- category: string — one of: credentialing, claims, prior_auth, billing, other
- provider_name: string or null
- npi: string or null — 10-digit National Provider Identifier if present, else null
- missing_docs: string or null — comma-separated list of missing documents if mentioned, else null
- summary: string — 1-3 sentence summary
- confidence: integer 0-100 — your confidence in classification accuracy

Rules: Use null for unknown strings. npi must be exactly 10 digits or null.`;

/**
 * @param {{ subject: string, body: string, sender: string }} input
 * @returns {Promise<{
 *   actionable: boolean,
 *   category: string,
 *   provider_name: string | null,
 *   npi: string | null,
 *   missing_docs: string | null,
 *   summary: string,
 *   confidence: number
 * }>}
 */
export async function classifyEmail(input) {
  const userContent = `Subject: ${input.subject}\nFrom: ${input.sender}\n\n${input.body.slice(0, 12000)}`;

  const { data } = await axios.post(
    GROQ_URL,
    {
      model: config.groqModel,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${config.groqApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 60_000,
    }
  );

  const raw = data?.choices?.[0]?.message?.content?.trim() || "";
  return parseClassificationJson(raw);
}

/**
 * Safely parse and validate Groq JSON output.
 * @param {string} raw
 */
export function parseClassificationJson(raw) {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      obj = JSON.parse(text.slice(start, end + 1));
    } else {
      throw new Error("Invalid JSON from classifier");
    }
  }

  const confidence = clampInt(obj.confidence, 0, 100);
  let npi = obj.npi == null || obj.npi === "" ? null : String(obj.npi).replace(/\D/g, "");
  if (npi && npi.length !== 10) npi = null;

  return {
    actionable: Boolean(obj.actionable),
    category: String(obj.category || "other"),
    provider_name: obj.provider_name == null ? null : String(obj.provider_name),
    npi,
    missing_docs: obj.missing_docs == null ? null : String(obj.missing_docs),
    summary: String(obj.summary || "").slice(0, 2000),
    confidence,
  };
}

function clampInt(v, min, max) {
  const n = Number.parseInt(String(v), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}
