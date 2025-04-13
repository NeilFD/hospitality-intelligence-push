
// Only update the getTrackerSummaryByMonth function
export const getTrackerSummaryByMonth = async (year: number, month: number, moduleType: ModuleType = 'food'): Promise<TrackerSummary> => {
  try {
    const trackerData = await fetchTrackerDataByMonth(year, month, moduleType);
    
    let totalRevenue = 0;
    let totalPurchases = 0;
    let totalCreditNotes = 0;
    let totalStaffAllowance = 0;
    
    for (const day of trackerData) {
      totalRevenue += Number(day.revenue) || 0;
      totalStaffAllowance += Number(day.staff_food_allowance) || 0;
      
      const purchases = await fetchTrackerPurchases(day.id);
      const purchasesAmount = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      totalPurchases += purchasesAmount;
      
      const creditNotes = await fetchTrackerCreditNotes(day.id);
      const creditNotesAmount = creditNotes.reduce((sum, cn) => sum + Number(cn.amount || 0), 0);
      totalCreditNotes += creditNotesAmount;
    }
    
    const totalCost = totalPurchases - totalCreditNotes + totalStaffAllowance;
    const gpAmount = totalRevenue - totalCost;
    const gpPercentage = totalRevenue > 0 ? (gpAmount / totalRevenue) * 100 : 0;
    
    return {
      year,
      month,
      moduleType,
      revenue: totalRevenue,
      cost: totalCost, // Ensure cost is present
      purchases: totalPurchases,
      creditNotes: totalCreditNotes,
      staffAllowance: totalStaffAllowance,
      totalCost,
      gpAmount,
      gpPercentage
    };
  } catch (error) {
    console.error(`Error getting tracker summary for ${year}-${month}:`, error);
    throw error;
  }
};
