import React, { createContext, useContext, useState } from 'react';

const TaxationContext = createContext();

export const useTaxation = () => useContext(TaxationContext);

export const TaxationProvider = ({ children }) => {
  const [taxData, setTaxData] = useState({
    clientDetails: {
      pan: '',
      firstName: '',
      lastName: '',
      assessmentYear: '2026-27', // AY for FY 2025-26
    },
    incomes: {
      hasBusiness: false,
      hasCapitalGains: false,
      hasOtherSources: false,
      hasExemptIncome: false,
    },
    business: {
      isRegisteredGST: false,
      gstin: '',
      businessName: '',
      turnoverBank: 0,
      turnoverCash: 0,
      profitBank: 0, // Should be at least 6%
      profitCash: 0, // Should be at least 8%
      balanceSheet: {
        proprietorCapital: 0,
        reservesAndSurplus: 0,
        sundryDebtors: 0,
        sundryCreditors: 0,
        cashBalance: 0,
        bankBalance: 0,
        inventory: 0,
      }
    },
    capitalGains: {
      stcg: 0, // Example: 111A
      ltcg: 0, // Example: 112A
    },
    otherSources: {
      savingsInterest: 0,
      fdInterest: 0,
      taxRefundInterest: 0,
      anyOtherIncome: 0,
      dividend: {
        q1: 0, // Up to 15 Jun
        q2: 0, // 16 Jun - 15 Sep
        q3: 0, // 16 Sep - 15 Dec
        q4: 0, // 16 Dec - 15 Mar
        q5: 0, // 16 Mar - 31 Mar
      }
    },
    exemptIncome: {
      agriculture: 0,
      ppfInterest: 0,
      otherExempt: 0,
    },
    bfla: {
      businessLoss: 0,
      stcgLoss: 0,
      ltcgLoss: 0,
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

  return (
    <TaxationContext.Provider value={{ taxData, setTaxData, updateTaxData, updateNestedTaxData }}>
      {children}
    </TaxationContext.Provider>
  );
};
