import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5050;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY set - serving mock flashcard data.");
  }
});

// Triggering restart to load .env variables
