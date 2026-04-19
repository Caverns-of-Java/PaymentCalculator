export const state = {
  activeView: "summary",
  summary: null,
  expenseEntries: {
    ken: [],
    ethan: [],
  },
  bills: [],
  loadingSummary: false,
  loadingExpenseEntries: false,
  loadingBills: false,
  submittingExpense: false,
  submittingExpenseClear: false,
  submittingBill: false,
  submittingBillPayment: false,
  payingBillId: null,
};