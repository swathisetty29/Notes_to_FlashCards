import express from "express";
import cors from "cors";
import cardSetRoutes from "./routes/cardSetRoutes.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestBuckets = new Map();

function limitGenerationRequests(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  const bucket = requestBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait a minute and try again.",
      },
    });
  }

  bucket.count += 1;
  return next();
}

// Render forwards the original client IP in a trusted proxy header.
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      // Health checks and server-to-server calls do not include an Origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", limitGenerationRequests, cardSetRoutes);

// Fallback error handler - guarantees a JSON error instead of a raw crash
// if something throws unexpectedly anywhere upstream.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "SERVER_ERROR", message: "Unexpected server error." },
  });
});

export default app;
