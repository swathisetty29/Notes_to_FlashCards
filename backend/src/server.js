import "dotenv/config";
import dns from "node:dns";
import app from "./app.js";

// Some local networks resolve Google APIs to IPv6 first but cannot connect over
// IPv6. Prefer IPv4 so Gemini requests work reliably in local development.
dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 5050;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY set - serving mock flashcard data.");
  }
});

// Triggering restart to load .env variables
