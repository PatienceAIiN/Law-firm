import axios from "axios";
import { config } from "../config.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an enterprise healthcare operations assistant. Analyze the email and respond with ONLY a single JSON object (no markdown fences) with these keys:
- actionable: boolean
- category: string (credentialing, claims, prior_auth, billing, other)
- provider_name: string or null
- npi: string or null (10 digits if known, else null)
- missing_docs: string or null
- summary: string
- confidence: integer 0-100
Rules:
- confidence reflects how sure you are about category, provider, and next action
- npi must be null unless a clear 10-digit NPI appears
- missing_docs lists missing paperwork if any, else null
- summary should be 1-3 sentences`;

export function parseClassificationJson(raw) {
  let text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = fenced[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Invalid JSON from Groq classifier");
    }
    parsed = JSON.parse(text.slice(start, end + 1));
  }

  const confidence = clampInt(parsed.confidence, 0, 100);
  let npi =
    parsed.npi == null || parsed.npi === ""
      ? null
      : String(parsed.npi).replace(/\D/g, "");
  if (npi && npi.length !== 10) {
    npi = null;
  }

  return {
    actionable: Boolean(parsed.actionable),
    category: String(parsed.category || "other"),
    provider_name:
      parsed.provider_name == null ? null : String(parsed.provider_name),
    npi,
    missing_docs:
      parsed.missing_docs == null ? null : String(parsed.missing_docs),
    summary: String(parsed.summary || "").slice(0, 2000),
    confidence,
  };
}

export async function classifyEmail({ subject, body, sender }) {
  const userContent = `From: ${sender}\nSubject: ${subject}\n\n${body}`.slice(
    0,
    12000
  );

  const { data } = await axios.post(
    GROQ_URL,
    {
      model: config.groqModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
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

  const raw = String(data?.choices?.[0]?.message?.content || "").trim();
  if (!raw) {
    throw new Error("Empty response from Groq classifier");
  }

  try {
    return {
      raw,
      classification: parseClassificationJson(raw),
    };
  } catch (error) {
    error.raw = raw;
    throw error;
  }
}

function clampInt(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}
