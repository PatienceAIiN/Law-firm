import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config, assertProcessEnv } from "./config.js";
import { apiRouter } from "./routes/api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  assertProcessEnv();
} catch (e) {
  console.warn("[config]", e.message);
  console.warn("Set env vars before calling /process.");
}

const app = express();
const allowedOrigins = new Set([
  ...config.frontendOrigins,
  `http://localhost:${config.port}`,
  `http://127.0.0.1:${config.port}`,
]);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.use(apiRouter);

const clientDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Server http://localhost:${config.port}`);
});
