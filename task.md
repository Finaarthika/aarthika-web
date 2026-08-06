# Tax Engine UI Overhaul Tasks

- [x] Phase 10: Bank Accounts & Granular Prepaid Taxes
  - [x] Update `TaxationContext.jsx` to include `bankAccounts` array and `taxDeductors` array.
  - [x] Create `BankAccounts.jsx` component for adding/removing bank accounts (Bank Name, IFSC, Account Number, Type, Refund Select).
  - [x] Update `PrepaidTaxes.jsx` to include dynamic tables for TDS/TCS entries (TAN, Deductor, Amount).
  - [x] Update `TaxationDashboard.jsx` to include the Bank Accounts tab.
  - [x] Update `TaxDocumentGenerator.jsx` to map these detailed arrays into the PDF pages.

- [x] Phase 11: Business & Profession Detail
  - [x] Update `TaxationContext.jsx` with Business Nature Code and GSTIN details.
  - [x] Update `BusinessIncome.jsx` with inputs for Nature Code, GSTIN, and GST Turnover.
  - [x] Add strict presumptive limits validation.

- [x] Phase 12: Granular Capital Gains
  - [x] Update `TaxationContext.jsx` to store an array of `cgTransactions`.
  - [x] Update `CapitalGains.jsx` to feature a transaction grid for adding individual trades.
  - [x] Write logic to auto-compute Q1-Q5 and STCG/LTCG from the transaction array.

- [x] Phase 13: Granular Exempt Income & Other Sources
  - [x] Update `OtherSources.jsx` to handle Family Pension.
  - [x] Expand Exempt Income section.
