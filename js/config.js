export const APP_CONFIG = {
  apiBaseUrl: "https://script.google.com/macros/s/AKfycbysrz5tXE0nssvCuymewUrxqhn5AGXutqVFBzYCNoIynuOptRCEYfagX6290SGMpsdLAQ/exec",
  currency: "USD",
  locale: "en-US",
  requestTimeoutMs: 10000,
  billSplit: {
    ken: 0.6,
    ethan: 0.4,
  },
};

export function isApiConfigured() {
  return APP_CONFIG.apiBaseUrl.startsWith("http");
}