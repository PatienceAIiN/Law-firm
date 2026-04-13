import { prisma } from "../lib/prisma.js";

/**
 * Persist pipeline logs for compliance and debugging.
 */
export async function writeLog({ emailId, message, status }) {
  return prisma.log.create({
    data: {
      emailId: emailId ?? null,
      message,
      status,
    },
  });
}
