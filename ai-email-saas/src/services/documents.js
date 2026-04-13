import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.join(__dirname, "..", "..", "docs");

function sanitizeSegment(seg) {
  return String(seg || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64);
}

/**
 * Persist attachments under /docs/{npi}/ relative to project root.
 */
export async function saveAttachmentsForNpi(npi, attachments) {
  const folder = sanitizeSegment(npi || "unknown");
  const dir = path.join(DOCS_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });

  const saved = [];
  for (const att of attachments || []) {
    const name = sanitizeSegment(att.filename);
    const target = path.join(dir, `${Date.now()}_${name}`);
    await fs.writeFile(target, att.content);
    saved.push(target);
  }
  return saved;
}
