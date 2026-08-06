# Tax Engine Expansion Plan: Achieving Tax2Win/Quicko Parity

I understand completely. While our PDF *looks* similar now, it lacks the extreme, granular data because our **React UI data entry forms** are too simplified compared to a real tax portal like Tax2Win. We need to capture the exact, atomic data points (like Deductor TANs, Bank Accounts, GSTINs) to make our PDF as detailed as theirs. 

Since I cannot physically log into a third-party website or press F12, I have exhaustively cross-referenced the 51 Tax2Win screenshots you provided along with the `Detailed_Computation...pdf`. 

Here is the phase-wise implementation plan to replicate the complete Tax2Win self-filing data structures in our UI:

## Phase 10: Bank Accounts & Granular Prepaid Taxes (Form 26AS/AIS)
The Quicko/Tax2Win PDFs explicitly list the taxpayer's bank accounts and deductor details. We currently only have simple number inputs for TDS.
- **New Tab:** "Bank Accounts"
  - Inputs: Bank Name, IFSC Code, Account Number, Account Type (Savings/Current), and a toggle for "Select for Refund".
- **New Tab:** "Taxes Paid"
  - Dynamic Table for **TDS/TCS**: User can click "Add Row" and enter `Name of Deductor`, `TAN of Deductor`, `Gross Amount`, `Tax Deducted`, and `Head of Income`.

## Phase 11: Business & Profession Detail (ITR-4/Presumptive)
While we have the presumptive revenue (Bank/Cash) and the Balance Sheet, the real portals require more specific compliance data.
- Add **Business Nature Code** dropdown (e.g., 09005 - Retail Sale).
- Add **GSTIN Details**: If registered under GST, ask for `GSTIN` and `Turnover as per GST Return`. (This is mandatory in Tax2Win for cross-matching).
- Add **Detailed Cash/Bank Limits Check**: Implement the strict UI validations that block 44AD if turnover > ₹3 Cr (if 95% digital) or > ₹2 Cr (normal).

## Phase 12: Granular Capital Gains (Schedule CG)
Right now we ask for Q1-Q5 totals. Tax2Win asks for the actual transaction data to compute the quarters automatically.
- Create a **Capital Gains Transaction Grid**.
- Inputs: `Asset Type` (Equity/Mutual Fund), `Date of Purchase`, `Date of Sale`, `Purchase Value`, `Sale Value`, and `Brokerage/Transfer Expenses`. 
- Logic: The app will auto-classify into STCG/LTCG, auto-apply the ₹1.25L exemption for 112A, and auto-allocate into the Q1-Q5 buckets for Advance Tax calculation.

## Phase 13: Granular Exempt Income & Other Sources
Tax2Win has an exhaustive list of exempt incomes and other sources to ensure the "Gross Total Income" is exactly correct.
- Expand "Other Sources" to include specific UI fields for `Family Pension` (and auto-calculate the 1/3rd or 15,000 standard deduction).
- Expand "Exempt Income" to include specific dropdowns for Section 10 exemptions (e.g., `Sec 10(10D) Life Insurance`, `Sec 10(11) Statutory PF`, `Sec 10(34) Exempt Dividends`).

## User Review Required
Does this phase-wise plan correctly identify the granular data entry screens we need to build to reach true parity with the Tax2Win developer/internal data structures? If you approve, I will immediately begin executing Phase 10 to add the Bank Accounts and Deductor Tables!
