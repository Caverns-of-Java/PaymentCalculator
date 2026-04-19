# Payment Calculator

Static single-page frontend for GitHub Pages plus a Google Apps Script backend backed by Google Sheets.

## Project structure

- `index.html` contains the full SPA shell with Summary and Bills views.
- `styles.css` contains the responsive visual design.
- `js/config.js` stores runtime configuration, including the deployed Apps Script URL.
- `js/api.js` wraps all API requests and parses `text/plain` JSON responses.
- `js/app.js` binds UI events, renders data, and submits forms.
- `apps-script/Code.gs` contains the Google Apps Script backend.

## Spreadsheet schema

Create these sheets in the target spreadsheet.

### Main

Use row 1 for headers and row 2 for live values.

| A | B | C | D |
|---|---|---|---|
| LastUpdated | TotalOwing | KenShare | EthanShare |

### Ken_Only

| A | B | C | D |
|---|---|---|---|
| Timestamp | Amount | Summary | Hide |

### Ethan_Only

| A | B | C | D |
|---|---|---|---|
| Timestamp | Amount | Summary | Hide |

For both personal-expense sheets, keep column C reserved for the sheet summary formula.

- `C1` should be `Summary`
- `C2` should contain the formula `=SUM(B2:B)`
- `D1` should be `Hide`
- New expense rows are appended with values in columns A and B only
- When "Clear for new period" is used, existing rows are marked with `hide` in column D and excluded from app totals/lists

### Bills

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Id | Timestamp | WhatFor | TotalAmount | KenShare | EthanShare | DueDate |

## Deploy Apps Script

1. Create a new Apps Script project connected to the spreadsheet.
2. Paste the contents of `apps-script/Code.gs` into the editor.
3. Deploy as a web app.
4. Set Execute as: `Me`.
5. Set Who has access: `Anyone with the link`.
6. Copy the deployed URL.

## Test Apps Script in the editor

Do not click `Run` on `doPost` directly. Apps Script only supplies the `e.postData` event object when the web app receives a real HTTP request.

Use these helper functions from [apps-script/Code.gs](apps-script/Code.gs) instead:

- `testGetSummary()`
- `testGetBills()`
- `testPostExpense()`
- `testPostBill()`

Each helper builds a mock event object and writes the JSON response to the Apps Script log.

## Configure the frontend

1. Open `js/config.js`.
2. Replace `PASTE_APPS_SCRIPT_URL_HERE` with the deployed Apps Script URL.
3. Commit the site files to the branch or folder you publish with GitHub Pages.

## Local preview

Because the frontend uses ES modules, serve the folder with a local HTTP server instead of opening `index.html` directly from disk.

Examples:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- Apps Script responses are returned as `text/plain`, but they still contain JSON content.
- Apps Script does not provide normal HTTP status control through `ContentService`, so errors are returned with a JSON payload using `{ status: "error", code, message }`.
- The frontend disables submit buttons during writes to reduce duplicate submissions.
- The v1 security model is open-link access only. Anyone with the deployed script URL can write data.