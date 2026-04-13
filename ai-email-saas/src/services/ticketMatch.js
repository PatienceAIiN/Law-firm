import { prisma } from "../lib/prisma.js";

/**
 * Match ticket by NPI (exact) or provider name (case-insensitive contains).
 */
export async function matchTicket({ npi, providerName }) {
  if (npi && String(npi).length === 10) {
    const byNpi = await prisma.ticket.findFirst({ where: { npi } });
    if (byNpi) return byNpi;
  }

  if (providerName && String(providerName).trim()) {
    const name = String(providerName).trim();
    const byName = await prisma.ticket.findFirst({
      where: {
        providerName: { equals: name, mode: "insensitive" },
      },
    });
    if (byName) return byName;
  }

  return null;
}
