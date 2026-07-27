import express from "express";
import cors from "cors";
import cardSetRoutes from "./routes/cardSetRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", cardSetRoutes);

// Fallback error handler - guarantees a JSON error instead of a raw crash
// if something throws unexpectedly anywhere upstream.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "SERVER_ERROR", message: "Unexpected server error." },
  });
});

export default app;
