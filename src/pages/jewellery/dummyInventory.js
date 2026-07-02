export const dummyInventoryData = {
  lastUpdated: new Date().toISOString(),
  categories: [
    {
      id: "cat_gold_rings_22k",
      name: "Gold Rings (22K)",
      metalType: "Gold",
      purity: "22K",
      openingCount: 150,
      openingWeight: 450.500,
      soldCountToday: 3,
      soldWeightToday: 12.350,
      addedCountToday: 0,
      addedWeightToday: 0.000,
      lastAuditDate: "2026-07-01T20:30:00Z",
      lastAuditStatus: "Verified",
      requiresDeepAudit: false // Russian Roulette flag
    },
    {
      id: "cat_gold_chains_22k",
      name: "Gold Chains (22K)",
      metalType: "Gold",
      purity: "22K",
      openingCount: 45,
      openingWeight: 680.200,
      soldCountToday: 1,
      soldWeightToday: 15.500,
      addedCountToday: 0,
      addedWeightToday: 0.000,
      lastAuditDate: "2026-07-01T20:45:00Z",
      lastAuditStatus: "Verified",
      requiresDeepAudit: true // Triggered for today!
    },
    {
      id: "cat_gold_earrings_22k",
      name: "Gold Earrings (22K)",
      metalType: "Gold",
      purity: "22K",
      openingCount: 200,
      openingWeight: 850.750,
      soldCountToday: 0,
      soldWeightToday: 0.000,
      addedCountToday: 20, // Received from custom orders
      addedWeightToday: 85.000,
      lastAuditDate: "2026-07-01T21:00:00Z",
      lastAuditStatus: "Verified",
      requiresDeepAudit: false
    },
    {
      id: "cat_silver_payals",
      name: "Silver Payals (Anklets)",
      metalType: "Silver",
      purity: "80%",
      openingCount: 300,
      openingWeight: 4500.000,
      soldCountToday: 5,
      soldWeightToday: 150.000,
      addedCountToday: 0,
      addedWeightToday: 0.000,
      lastAuditDate: "2026-07-01T21:00:00Z",
      lastAuditStatus: "Verified",
      requiresDeepAudit: false
    },
    {
      id: "cat_silver_coins",
      name: "Silver Coins (99.9%)",
      metalType: "Silver",
      purity: "99.9%",
      openingCount: 500,
      openingWeight: 5000.000,
      soldCountToday: 10,
      soldWeightToday: 100.000,
      addedCountToday: 0,
      addedWeightToday: 0.000,
      lastAuditDate: "2026-06-30T20:00:00Z",
      lastAuditStatus: "Discrepancy", // Requires manager attention
      requiresDeepAudit: true
    }
  ],
  recentAudits: [
    {
      auditId: "AUD-1001",
      date: "2026-07-01T20:30:00Z",
      categoryId: "cat_gold_rings_22k",
      staffId: "Shriyanshu",
      expectedCount: 150,
      expectedWeight: 450.500,
      actualCount: 150,
      actualWeight: 450.500,
      status: "Match",
      auditType: "Standard",
      notes: "Checked and verified on scale."
    },
    {
      auditId: "AUD-1002",
      date: "2026-06-30T20:00:00Z",
      categoryId: "cat_silver_coins",
      staffId: "Shriyanshu",
      expectedCount: 500,
      expectedWeight: 5000.000,
      actualCount: 499,
      actualWeight: 4990.000,
      status: "Discrepancy",
      auditType: "Deep Audit",
      notes: "Missing 1 coin. Investigating CCTV."
    }
  ]
};
