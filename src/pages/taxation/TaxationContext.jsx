import React, { createContext, useContext, useState } from 'react';

const TaxationContext = createContext();

export const useTaxation = () => useContext(TaxationContext);

export const TaxationProvider = ({ children }) => {
  const [taxData, setTaxData] = useState({
    clientDetails: {
      pan: '',
      firstName: '',
      middleName: '',
      lastName: '',
      fatherName: '',
      mobile: '',
      email: '',
      gender: 'Male',
      dob: '',
      assessmentYear: '2026-27', // AY for FY 2025-26
      pincode: '',
      flatDoor: '',
      building: '',
      road: '',
      area: '',
      employerCategory: 'private',
      aadhaar: '',
      aadhaarEnrollment: '',
      foreignAssets: false,
      isDirector: false,
      unlistedShares: false,
    },
    bankAccounts: [
      { id: 1, bankName: '', ifsc: '', accountNumber: '', type: 'Savings', isRefund: true }
    ],
    taxDeductors: [], // Array of { id, deductorName, tan, grossAmount, taxDeducted, headOfIncome }
    incomes: {
      hasBusiness: false,
      hasCapitalGains: false,
      hasOtherSources: false,
      hasExemptIncome: false,
      hasDeductions: false,
      hasPrepaidTaxes: false,
    },
    business: {
      businessIncomeType: 'presumptive',
      presumptiveType: '44AD',
      businessCategory: '',
      businessDescription: '',
      hasFinancialParticulars: false,
      isRegisteredGST: false,
      gstin: '',
      gstTurnover: 0,
      businessName: '',
      businessNatureCode: '09005', // Default: Retail Sale of Other Products
      turnoverBank: 0,
      turnoverCash: 0,
      profitBank: 0, // Should be at least 6%
      profitCash: 0, // Should be at least 8%
      balanceSheet: {
        // Assets
        investmentsST: 0,
        investmentsLT: 0,
        currentBank: 0,
        currentCash: 0,
        currentStock: 0,
        currentReceivables: 0,
        currentLoansGiven: 0,
        currentOther: 0,
        fixedGrossBlock: 0,
        fixedDepreciation: 0,
        // Liabilities
        equityCapital: 0,
        equityReserves: 0,
        nonCurrentSecured: 0,
        nonCurrentUnsecured: 0,
        nonCurrentAdvances: 0,
        currentPayables: 0,
        currentProvisions: 0,
        currentOtherLiab: 0,
      }
    },
    capitalGains: {
      stcg: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }, // 111A 20%
      ltcg: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 }, // 112A 12.5%
    },
    cgTransactions: [], // Array of { id, assetName, isin, type (Equity/MF), buyDate, sellDate, buyValue, sellValue, expenses }
    otherSources: {
      savingsInterest: 0,
      fdInterest: 0,
      taxRefundInterest: 0,
      bondsInterest: 0,
      epfInterest: 0,
      loansInterest: 0,
      familyPension: 0,
      anyOtherIncome: 0,
      anyOtherIncomeNarration: '',
      dividend: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 },
      gifts: {
        immovable: 0,
        movable: 0,
        monetary: 0,
        isExemptOccasion: false,
        exemptGiftNarration: '',
      }
    },
    exemptIncome: {
      agriculture: 0,
      ppfInterest: 0,
      insuranceMaturity: 0,
      npsWithdrawal: 0,
      pfMaturity: 0,
      hufShare: 0,
      ssyMaturity: 0,
      otherExempt: 0,
    },
    bfla: {
      businessLoss: 0,
      stcgLoss: 0,
      ltcgLoss: 0,
    },
    deductions: {
      sec80CCD2: 0,
      sec80CCH: 0,
    },
    prepaidTaxes: {
      advanceTax: 0,
      tdsSalary: 0,
      tdsOther: 0,
      tcs: 0,
    }
  });

  const updateTaxData = (section, key, value) => {
    setTaxData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNestedTaxData = (section, subSection, key, value) => {
    setTaxData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [key]: value
        }
      }
    }));
  };

  const updateArrayData = (arrayName, newArray) => {
    setTaxData(prev => ({
      ...prev,
      [arrayName]: newArray
    }));
  };

  return (
    <TaxationContext.Provider value={{ taxData, setTaxData, updateTaxData, updateNestedTaxData, updateArrayData }}>
      {children}
    </TaxationContext.Provider>
  );
};
