import "dotenv/config";

function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function optional(name, fallback = undefined) {
  const v = process.env[name];
  if (v == null) return fallback;
  const trimmed = String(v).trim();
  return trimmed === "" ? fallback : trimmed;
}

function parseOrigins(value) {
  const origins = new Set();

  for (const raw of [value, process.env.RENDER_EXTERNAL_URL, "http://localhost:5173"]) {
    for (const item of String(raw || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)) {
      origins.add(item.replace(/\/$/, ""));
    }
  }

  return [...origins];
}

function normalizeGroqModel(value) {
  const model = optional("GROQ_MODEL", value || "llama-3.3-70b-versatile");
  if (!model) return "llama-3.3-70b-versatile";

  const deprecated = new Map([
    ["llama3-70b-8192", "llama-3.3-70b-versatile"],
    ["llama3-8b-8192", "llama-3.1-8b-instant"],
  ]);

  return deprecated.get(model) || model;
}

const frontendOrigins = parseOrigins(process.env.FRONTEND_ORIGIN);
const emailUser = optional("EMAIL_USER");

export const config = {
  port: Number(process.env.PORT) || 3001,
  frontendOrigin: frontendOrigins[0],
  frontendOrigins,
  databaseUrl: optional("DATABASE_URL"),
  groqApiKey: optional("GROQ_API_KEY"),
  groqModel: normalizeGroqModel("llama-3.3-70b-versatile"),
  emailUser,
  emailPass: optional("EMAIL_PASS"),
  imapHost: optional("IMAP_HOST", "imap.gmail.com"),
  imapPort: Number(optional("IMAP_PORT", "993")) || 993,
  imapMaxFetch: Number(optional("IMAP_MAX_FETCH", "25")) || 25,
  smtpHost: optional("SMTP_HOST", "smtp.gmail.com"),
  smtpPort: Number(optional("SMTP_PORT", "465")) || 465,
  smtpSecure:
    optional("SMTP_SECURE") == null
      ? (Number(optional("SMTP_PORT", "465")) || 465) === 465
      : optional("SMTP_SECURE").toLowerCase() === "true",
  emailFrom: optional("EMAIL_FROM", emailUser),
};

export function assertProcessEnv() {
  required("DATABASE_URL");
  required("GROQ_API_KEY");
  required("EMAIL_USER");
  required("EMAIL_PASS");
  required("IMAP_HOST");
}
