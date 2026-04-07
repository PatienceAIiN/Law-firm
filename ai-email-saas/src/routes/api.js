import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  runPipeline,
  approveAndSend,
  rejectEmail,
  runTestEmailFlow,
} from "../services/pipeline.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.get("/process", async (_req, res) => {
  try {
    const summary = await runPipeline();
    res.json(summary);
  } catch (err) {
    res.status(500).json({
      error: String(err?.message || err),
    });
  }
});

apiRouter.post("/test-email", async (req, res) => {
  try {
    const email = await runTestEmailFlow(req.body?.text);
    res.json({ ok: true, email });
  } catch (err) {
    res.status(400).json({
      error: String(err?.message || err),
    });
  }
});

apiRouter.get("/emails", async (req, res) => {
  try {
    const { status, q, category, limit = "100" } = req.query;
    const take = Math.min(500, Math.max(1, Number(limit) || 100));
    const where = {};
    if (status && typeof status === "string") {
      where.status = status;
    }
    if (category && typeof category === "string") {
      where.category = { contains: category, mode: "insensitive" };
    }
    if (q && typeof q === "string" && q.trim()) {
      const term = q.trim();
      where.OR = [
        { subject: { contains: term, mode: "insensitive" } },
        { sender: { contains: term, mode: "insensitive" } },
        { body: { contains: term, mode: "insensitive" } },
        { providerName: { contains: term, mode: "insensitive" } },
        { npi: { contains: term } },
      ];
    }
    const emails = await prisma.email.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

apiRouter.get("/review", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        status: { in: ["review", "manual"] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

apiRouter.post("/approve/:id", async (req, res) => {
  try {
    await approveAndSend(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    const msg = String(err?.message || err);
    const code = msg === "Email not found" ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

apiRouter.post("/reject/:id", async (req, res) => {
  try {
    await rejectEmail(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    const msg = String(err?.message || err);
    const code = msg === "Email not found" ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

apiRouter.get("/logs", async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

apiRouter.get("/stats", async (_req, res) => {
  try {
    const [
      total,
      review,
      manual,
      autoSent,
      failed,
      todayStart,
    ] = await Promise.all([
      prisma.email.count(),
      prisma.email.count({ where: { status: "review" } }),
      prisma.email.count({ where: { status: "manual" } }),
      prisma.email.count({ where: { status: "auto_sent" } }),
      prisma.email.count({ where: { status: "send_failed" } }),
      prisma.email.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);
    res.json({
      totalEmails: total,
      inReview: review + manual,
      autoSent,
      sendFailed: failed,
      ingestedToday: todayStart,
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});
