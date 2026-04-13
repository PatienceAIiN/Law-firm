import { prisma } from "../lib/prisma.js";

/**
 * @param {string | null} emailId
 * @param {string} message
 * @param {"info"|"warn"|"error"|"success"} status
 */
export async function logStep(emailId, message, status = "info") {
  await prisma.log.create({
    data: {
      emailId: emailId || undefined,
      message,
      status,
    },
  });
}
