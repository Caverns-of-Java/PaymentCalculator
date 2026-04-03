import { createBill, createExpense, fetchBills, fetchExpenseEntries, fetchSummary, updateTotalOwing } from "./api.js";
import { isApiConfigured } from "./config.js";
import { formatCurrency, formatDate, formatDateTime, normalizeAmount, normalizeNonNegativeAmount, sortBillsByDueDate } from "./formatters.js";
import { state } from "./state.js";

let deferredInstallPrompt = null;

const elements = {
  statusBanner: document.querySelector("#statusBanner"),
  refreshButton: document.querySelector("#refreshButton"),
  updatedValue: document.querySelector("#updatedValue"),
  totalValue: document.querySelector("#totalValue"),
  kenShareValue: document.querySelector("#kenShareValue"),
  ethanShareValue: document.querySelector("#ethanShareValue"),
  kenExpensesValue: document.querySelector("#kenExpensesValue"),
  ethanExpensesValue: document.querySelector("#ethanExpensesValue"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseSubmitButton: document.querySelector("#expenseSubmitButton"),
  editTotalOwingButton: document.querySelector("#editTotalOwingButton"),
  totalOwingModal: document.querySelector("#totalOwingModal"),
  closeTotalOwingModalButton: document.querySelector("#closeTotalOwingModalButton"),
  totalOwingForm: document.querySelector("#totalOwingForm"),
  totalOwingAmount: document.querySelector("#totalOwingAmount"),
  totalOwingSubmitButton: document.querySelector("#totalOwingSubmitButton"),
  kenExpenseEntries: document.querySelector("#kenExpenseEntries"),
  ethanExpenseEntries: document.querySelector("#ethanExpenseEntries"),
  kenExpenseEntriesEmpty: document.querySelector("#kenExpenseEntriesEmpty"),
  ethanExpenseEntriesEmpty: document.querySelector("#ethanExpenseEntriesEmpty"),
  billForm: document.querySelector("#billForm"),
  billSubmitButton: document.querySelector("#billSubmitButton"),
  billsContainer: document.querySelector("#billsContainer"),
  billsEmptyState: document.querySelector("#billsEmptyState"),
  viewButtons: [...document.querySelectorAll("[data-view-button]")],
  viewPanels: [...document.querySelectorAll("[data-view]")],
};

function setStatus(message, tone = "success") {
  if (!message) {
    elements.statusBanner.hidden = true;
    elements.statusBanner.textContent = "";
    elements.statusBanner.dataset.tone = "";
    return;
  }

  elements.statusBanner.hidden = false;
  elements.statusBanner.dataset.tone = tone;
  elements.statusBanner.textContent = message;
}

function setButtonLoading(button, isLoading, loadingLabel, defaultLabel) {
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingLabel : defaultLabel;
}

function switchView(viewName) {
  state.activeView = viewName;

  elements.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewButton === viewName);
  });

  elements.viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.view === viewName);
  });
}

function openTotalOwingModal() {
  elements.totalOwingModal.hidden = false;
  const currentTotal = Number(state.summary?.totalOwing);

  if (Number.isFinite(currentTotal)) {
    elements.totalOwingAmount.value = currentTotal.toFixed(2);
  }

  elements.totalOwingAmount.focus();
}

function closeTotalOwingModal() {
  elements.totalOwingModal.hidden = true;
}

function renderSummary() {
  const summary = state.summary;

  elements.totalValue.textContent = formatCurrency(summary?.totalOwing);
  elements.kenShareValue.textContent = formatCurrency(summary?.kenShare);
  elements.ethanShareValue.textContent = formatCurrency(summary?.ethanShare);
  elements.kenExpensesValue.textContent = formatCurrency(summary?.kenExpenses);
  elements.ethanExpensesValue.textContent = formatCurrency(summary?.ethanExpenses);
  elements.updatedValue.textContent = summary ? formatDateTime(summary.lastUpdated) : "Not loaded";
}

function createExpenseListItem(entry) {
  const item = document.createElement("li");
  item.className = "expense-list-item";

  const dateSpan = document.createElement("span");
  dateSpan.className = "expense-list-date";
  dateSpan.textContent = formatDate(entry.timestamp);

  const amountSpan = document.createElement("span");
  amountSpan.className = "expense-list-amount";
  amountSpan.textContent = formatCurrency(entry.amount);

  item.append(dateSpan, amountSpan);
  return item;
}

function renderExpenseEntries() {
  const kenEntries = state.expenseEntries.ken || [];
  const ethanEntries = state.expenseEntries.ethan || [];

  elements.kenExpenseEntries.replaceChildren();
  elements.ethanExpenseEntries.replaceChildren();

  elements.kenExpenseEntriesEmpty.hidden = kenEntries.length > 0;
  elements.ethanExpenseEntriesEmpty.hidden = ethanEntries.length > 0;

  kenEntries.forEach((entry) => {
    elements.kenExpenseEntries.appendChild(createExpenseListItem(entry));
  });

  ethanEntries.forEach((entry) => {
    elements.ethanExpenseEntries.appendChild(createExpenseListItem(entry));
  });
}

function createBillCard(bill) {
  const article = document.createElement("article");
  article.className = "bill-card";

  const topRow = document.createElement("div");
  topRow.className = "bill-card-top";

  const whatFor = document.createElement("p");
  whatFor.className = "bill-what-for";
  whatFor.textContent = `What For: ${bill.whatFor || "Untitled bill"}`;

  const dueDate = document.createElement("p");
  dueDate.className = "bill-due-date";
  dueDate.textContent = `Due: ${formatDate(bill.dueDate)}`;

  const total = document.createElement("p");
  total.className = "bill-total";
  total.textContent = formatCurrency(bill.totalAmount);

  const shares = document.createElement("div");
  shares.className = "bill-shares";

  const kenShare = document.createElement("p");
  kenShare.className = "bill-share bill-share-ken";
  kenShare.textContent = `Ken: ${formatCurrency(bill.kenShare)}`;

  const ethanShare = document.createElement("p");
  ethanShare.className = "bill-share bill-share-ethan";
  ethanShare.textContent = `Ethan: ${formatCurrency(bill.ethanShare)}`;

  topRow.append(whatFor, dueDate);
  shares.append(kenShare, ethanShare);
  article.append(topRow, total, shares);
  return article;
}

function renderBills() {
  elements.billsContainer.replaceChildren();

  const sortedBills = sortBillsByDueDate(state.bills);

  elements.billsEmptyState.hidden = sortedBills.length > 0;

  sortedBills.forEach((bill) => {
    elements.billsContainer.appendChild(createBillCard(bill));
  });
}

async function loadSummary({ showSuccessMessage = false } = {}) {
  state.loadingSummary = true;
  setButtonLoading(elements.refreshButton, true, "Refreshing...", "Refresh Data");

  try {
    state.summary = await fetchSummary();
    renderSummary();

    if (showSuccessMessage) {
      setStatus("Up to date", "success");
    }
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.loadingSummary = false;
    setButtonLoading(elements.refreshButton, false, "Refreshing...", "Refresh Data");
  }
}

async function loadBillsList() {
  state.loadingBills = true;

  try {
    const bills = await fetchBills();
    state.bills = Array.isArray(bills) ? bills : [];
    renderBills();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.loadingBills = false;
  }
}

async function loadExpenseEntries() {
  state.loadingExpenseEntries = true;

  try {
    const payload = await fetchExpenseEntries();
    state.expenseEntries = {
      ken: Array.isArray(payload?.ken) ? payload.ken : [],
      ethan: Array.isArray(payload?.ethan) ? payload.ethan : [],
    };
    renderExpenseEntries();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.loadingExpenseEntries = false;
  }
}

async function handleExpenseSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.expenseForm);
  const amount = normalizeAmount(formData.get("amount"));

  if (!amount) {
    setStatus("Enter a valid expense amount greater than zero.", "error");
    return;
  }

  state.submittingExpense = true;
  setButtonLoading(elements.expenseSubmitButton, true, "Saving...", "Save expense");

  try {
    await createExpense({
      type: formData.get("type"),
      amount,
    });

    elements.expenseForm.reset();
    setStatus("Expense saved.", "success");
    await Promise.all([loadSummary(), loadExpenseEntries()]);
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.submittingExpense = false;
    setButtonLoading(elements.expenseSubmitButton, false, "Saving...", "Save expense");
  }
}

async function handleBillSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.billForm);
  const amount = normalizeAmount(formData.get("amount"));
  const whatFor = String(formData.get("whatFor") || "").trim();
  const dueDate = String(formData.get("dueDate") || "").trim();

  if (!whatFor) {
    setStatus("Enter what the bill is for.", "error");
    return;
  }

  if (!amount) {
    setStatus("Enter a valid bill amount greater than zero.", "error");
    return;
  }

  if (!dueDate) {
    setStatus("Choose a due date for the bill.", "error");
    return;
  }

  state.submittingBill = true;
  setButtonLoading(elements.billSubmitButton, true, "Saving...", "Save bill");

  try {
    await createBill({
      type: "bill",
      whatFor,
      amount,
      dueDate,
    });

    elements.billForm.reset();
    setStatus("Bill saved.", "success");
    await loadBillsList();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    state.submittingBill = false;
    setButtonLoading(elements.billSubmitButton, false, "Saving...", "Save bill");
  }
}

async function handleTotalOwingSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.totalOwingForm);
  const amount = normalizeNonNegativeAmount(formData.get("amount"));

  if (amount === null) {
    setStatus("Enter a valid total owing amount (for example 4000, 3500+500, or 4200/2).", "error");
    return;
  }

  setButtonLoading(elements.totalOwingSubmitButton, true, "Updating...", "Update total owing");

  try {
    await updateTotalOwing({
      type: "total_owing",
      amount: Math.round(amount * 100) / 100,
    });

    setStatus("Total owing updated.", "success");
    await loadSummary();
    closeTotalOwingModal();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setButtonLoading(elements.totalOwingSubmitButton, false, "Updating...", "Update total owing");
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => {
    void Promise.all([loadSummary({ showSuccessMessage: true }), loadExpenseEntries(), loadBillsList()]);
  });

  elements.expenseForm.addEventListener("submit", (event) => {
    void handleExpenseSubmit(event);
  });

  elements.editTotalOwingButton.addEventListener("click", openTotalOwingModal);
  elements.closeTotalOwingModalButton.addEventListener("click", closeTotalOwingModal);

  elements.totalOwingModal.addEventListener("click", (event) => {
    if (event.target === elements.totalOwingModal) {
      closeTotalOwingModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.totalOwingModal.hidden) {
      closeTotalOwingModal();
    }
  });

  elements.totalOwingForm.addEventListener("submit", (event) => {
    void handleTotalOwingSubmit(event);
  });

  elements.billForm.addEventListener("submit", (event) => {
    void handleBillSubmit(event);
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchView(button.dataset.viewButton);
    });
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (_error) {
    // Keep app usable even if service worker registration fails.
  }
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", async (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (_error) {
      // Some browsers require a user gesture; silently ignore.
    } finally {
      deferredInstallPrompt = null;
    }
  });
}

async function initializeApp() {
  setupInstallPrompt();
  await registerServiceWorker();
  bindEvents();
  renderSummary();
  renderExpenseEntries();
  renderBills();
  switchView(state.activeView);

  if (!isApiConfigured()) {
    setStatus("Add your deployed Apps Script URL in js/config.js to start loading live data.", "error");
    return;
  }

  try {
    await Promise.all([loadSummary(), loadExpenseEntries(), loadBillsList()]);
    setStatus("Up to date", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

void initializeApp();