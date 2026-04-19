import { APP_CONFIG, isApiConfigured } from "./config.js";

class ApiError extends Error {
  constructor(message, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function ensureConfigured() {
  if (!isApiConfigured()) {
    throw new ApiError("Add your deployed Apps Script URL in js/config.js before using the app.", "CONFIG_MISSING");
  }
}

function buildUrl(searchParams = {}) {
  const url = new URL(APP_CONFIG.apiBaseUrl);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url;
}

async function readJsonResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new ApiError(`The API returned invalid JSON: ${error.message}`, "INVALID_JSON");
  }
}

async function request({ method = "GET", searchParams, payload }) {
  ensureConfigured();

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), APP_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(buildUrl(searchParams), {
      method,
      headers: payload ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new ApiError(data?.message || `Request failed with status ${response.status}.`, data?.code || "HTTP_ERROR");
    }

    if (data?.status === "error") {
      throw new ApiError(data.message || "The API reported an error.", data.code || "API_ERROR");
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("The request timed out before the API responded.", "TIMEOUT");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(error.message || "An unexpected network error occurred.", "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function fetchSummary() {
  return request({ method: "GET" });
}

export function createExpense(payload) {
  return request({ method: "POST", payload });
}

export function updateTotalOwing(payload) {
  return request({ method: "POST", payload });
}

export function fetchBills() {
  return request({ method: "GET", searchParams: { bills: true } });
}

export function fetchExpenseEntries() {
  return request({ method: "GET", searchParams: { expenses: true } });
}

export function createBill(payload) {
  return request({ method: "POST", payload });
}

export function markBillPaid(payload) {
  return request({ method: "POST", payload });
}

export function clearExpensePeriod(payload) {
  return request({ method: "POST", payload });
}

export { ApiError };