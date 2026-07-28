import axios from "axios";

const client = axios.create({
  // Vite proxies /api in development; deployments provide the Express URL.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 25_000,
});

/**
 * Requests a card set for the given text. Accepts an AbortController signal
 * so callers (see useCardGeneration) can cancel a stale in-flight request
 * when a newer one starts.
 *
 * Throws a normalized error object: { code, message } — never a raw axios
 * error — so calling code doesn't need to know about axios internals.
 */
export async function fetchCardSet(text, signal) {
  try {
    const res = await client.post("/generate-cards", { text }, { signal });
    return res.data.data;
  } catch (err) {
    if (axios.isCancel(err) || err.code === "ERR_CANCELED") {
      // Not a real error - caller ignores this because a newer request
      // superseded it. Re-throw with a distinguishable code.
      throw { code: "CANCELED", message: "Request canceled" };
    }
    if (err.code === "ECONNABORTED") {
      throw { code: "TIMEOUT", message: "The request took too long. Please try again." };
    }
    if (err.response?.data?.error) {
      throw err.response.data.error;
    }
    throw { code: "NETWORK_ERROR", message: "Couldn't reach the server. Check your connection and try again." };
  }
}

export async function refineCardSet(existingCards, instruction, signal) {
  try {
    const res = await client.post("/refine-cards", { existingCards, instruction }, { signal });
    return res.data.data;
  } catch (err) {
    if (axios.isCancel(err) || err.code === "ERR_CANCELED") {
      throw { code: "CANCELED", message: "Request canceled" };
    }
    if (err.code === "ECONNABORTED") {
      throw { code: "TIMEOUT", message: "The request took too long. Please try again." };
    }
    if (err.response?.data?.error) {
      throw err.response.data.error;
    }
    throw { code: "NETWORK_ERROR", message: "Couldn't reach the server. Check your connection and try again." };
  }
}
