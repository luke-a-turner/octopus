import { DetailGridRow } from '../components/DetailGrid';
import { PeriodFilter } from '../components/CostSummaryTable';

interface TariffAndConsumptionData {
  valid_from: string;
  value_inc_vat: number;
  consumption: number;
}

// Helper function to get start of week (Monday)
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Transform and filter data for the detail grid
export function transformToDetailGridData(
  mtdData: TariffAndConsumptionData[],
  selectedPeriod: PeriodFilter
): DetailGridRow[] {
  if (mtdData.length === 0) return [];

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(now);

  // Filter data based on selected period
  let filteredData = mtdData;

  if (selectedPeriod === 'today') {
    filteredData = mtdData.filter(item => {
      const itemDate = new Date(item.valid_from);
      return itemDate >= todayStart;
    });
  } else if (selectedPeriod === 'wtd') {
    filteredData = mtdData.filter(item => {
      const itemDate = new Date(item.valid_from);
      return itemDate >= weekStart;
    });
  }
  // 'mtd' or null shows all mtdData

  // Group by date and aggregate
  const groupedByDate = filteredData.reduce((acc, item) => {
    const dateTime = new Date(item.valid_from);
    const dateKey = dateTime.toLocaleDateString('en-GB');

    if (!acc[dateKey]) {
      acc[dateKey] = {
        dateTime: new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate()),
        totalConsumption: 0,
        totalCost: 0,
        rateSum: 0,
        rateCount: 0,
      };
    }

    // Calculate cost per 30-min interval: consumption (kWh) * rate (p/kWh) / 100 to get £
    const intervalCost = (item.consumption * item.value_inc_vat) / 100;
    acc[dateKey].totalConsumption += item.consumption;
    acc[dateKey].totalCost += intervalCost;
    // Accumulate rate sum for simple average
    acc[dateKey].rateSum += item.value_inc_vat;
    acc[dateKey].rateCount += 1;

    return acc;
  }, {} as Record<string, { dateTime: Date; totalConsumption: number; totalCost: number; rateSum: number; rateCount: number }>);

  // Transform to DetailGridRow format
  return Object.entries(groupedByDate).map(([date, data]) => {
    // Average rate in pence: simple average of all rates for the day
    const averageRate = data.rateCount > 0 ? data.rateSum / data.rateCount : 0;
    // Average cost per kWh in pence: (total cost in £ * 100) / total consumption
    const averageCostPerKwh = data.totalConsumption > 0 ? (data.totalCost * 100) / data.totalConsumption : 0;
    // Delta: difference between average cost and average rate
    const delta = averageCostPerKwh - averageRate;

    return {
      date,
      consumption: data.totalConsumption,
      cost: data.totalCost,
      averageRate,
      averageCostPerKwh,
      delta,
      dateTime: data.dateTime,
    };
  }).sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()); // Sort by most recent first
}
