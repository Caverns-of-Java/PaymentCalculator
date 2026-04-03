import { APP_CONFIG } from "./config.js";

const currencyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: "currency",
  currency: APP_CONFIG.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(APP_CONFIG.locale, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_CONFIG.locale, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "--";
  }

  return currencyFormatter.format(amount);
}

export function formatDate(dateValue) {
  const rawValue = String(dateValue || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? new Date(`${rawValue}T00:00:00`)
    : new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return dateFormatter.format(date);
}

export function formatDateTime(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return dateTimeFormatter.format(date);
}

export function normalizeAmount(rawAmount) {
  const amount = evaluateAmountExpression(rawAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

export function normalizeNonNegativeAmount(rawAmount) {
  const amount = evaluateAmountExpression(rawAmount);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function evaluateAmountExpression(rawAmount) {
  const source = String(rawAmount || "").trim();

  if (!source) {
    return Number.NaN;
  }

  // Allow only arithmetic expressions with numbers, spaces, decimal points, and parentheses.
  if (!/^[0-9+\-*/().\s]+$/.test(source)) {
    return Number.NaN;
  }

  try {
    const value = Function(`"use strict"; return (${source});`)();
    return Number(value);
  } catch (_error) {
    return Number.NaN;
  }
}

export function sortBillsByDueDate(bills) {
  return [...bills].sort((left, right) => {
    const leftTime = new Date(left.dueDate).getTime();
    const rightTime = new Date(right.dueDate).getTime();

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
      return 0;
    }

    if (Number.isNaN(leftTime)) {
      return 1;
    }

    if (Number.isNaN(rightTime)) {
      return -1;
    }

    return leftTime - rightTime;
  });
}