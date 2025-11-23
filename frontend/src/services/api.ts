import axios from 'axios';
import { Data } from 'plotly.js';

interface TariffAndConsumptionData {
  valid_from: string;
  value_inc_vat: number;
  consumption: number;
}

interface GroupedItem {
  time: string;
  tariffRate: number;
  consumption: number;
  dateTime: Date;
}

export interface CostSummary {
  totalCost: number;
  averageCostPerKwh: number;
  period?: string;
}

export interface DashboardData {
  chartData: Data[];
  costSummary: CostSummary;
}

// to expose a local app on network, you must use ip:port instead of localhost
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Helper function to get start of week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0); // Set to beginning of day
  return d;
}

// Helper function to get start of month
function getMonthStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0); // Set to beginning of day
  return d;
}

// Helper function to calculate cost summary from data
function calculateCostSummary(
  tariffConsumptionData: TariffAndConsumptionData[],
  period?: string
): CostSummary {
  let totalCost = 0;
  let totalConsumption = 0;

  tariffConsumptionData.forEach(timeInterval => {
    // Cost in pence = consumption (kWh) * price (p/kWh)
    const cost = timeInterval.consumption * timeInterval.value_inc_vat;
    totalCost += cost;
    totalConsumption += timeInterval.consumption;
  });

  const averageCostPerKwh = totalConsumption > 0 ? totalCost / totalConsumption : 0;

  return {
    totalCost: totalCost / 100, // Convert pence to pounds
    averageCostPerKwh,
    period,
  };
}

// Helper function to filter data by date range
function filterDataByDateRange(
  data: TariffAndConsumptionData[],
  startDate: Date,
  endDate: Date
): TariffAndConsumptionData[] {
  return data.filter(item => {
    const itemDate = new Date(item.valid_from);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

// Helper function to create chart data from tariff/consumption data
function createChartData(tariffConsumptionData: TariffAndConsumptionData[]): Data[] {
  // Sort all data by datetime first to ensure chronological order
  const sortedData = [...tariffConsumptionData].sort(
    (a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  );

  // Group tariff data by date and prepare data for plotting
  const grouped: Record<string, GroupedItem[]> = sortedData.reduce(
    (acc, item) => {
      const dateTime = new Date(item.valid_from);
      const dateKey = dateTime.toISOString().split('T')[0];
      const time = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        time,
        tariffRate: item.value_inc_vat,
        consumption: item.consumption,
        dateTime,
      });
      return acc;
    },
    {} as Record<string, GroupedItem[]>
  );

  // Create a trace for each date (line chart)
  const tariffColors = ['#E3E342', '#8F8F10', '#D2D690'];
  const tariffTraces: Data[] = Object.entries(grouped).map(([date, items], index) => {
    items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    return {
      x: items.map(item => item.dateTime),
      y: items.map(item => item.tariffRate),
      type: 'scattergl',
      mode: 'lines+markers',
      name: `${date} price`,
      line: {
        color: tariffColors[index % tariffColors.length],
        width: 2,
      },
      marker: {
        color: tariffColors[index % tariffColors.length],
      },
    };
  });

  const consumptionColors = ['#75DB0D', '#67A626', '#6B8F46'];
  const consumptionTraces: Data[] = Object.entries(grouped).map(([date, items], index) => {
    items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    return items.some(item => item.consumption)
      ? {
          x: items.map(item => item.dateTime),
          y: items.map(item => item.consumption),
          type: 'bar',
          name: `${date} consumption`,
          yaxis: 'y2',
          marker: {
            size: 6,
            color: consumptionColors[index % tariffColors.length],
          },
        }
      : {};
  });

  return [...tariffTraces, ...consumptionTraces];
}

export interface TariffInfo {
  rate: number;
  validFrom: string;
  validUntil?: string;
}

export interface AllDashboardData {
  mtdData: TariffAndConsumptionData[];
  mtdCostSummary: CostSummary;
  wtdCostSummary: CostSummary;
  todayCostSummary: CostSummary;
  chartData: Data[];
  chartCostSummary: CostSummary;
  currentTariff: TariffInfo | null;
  nextTariff: TariffInfo | null;
}

const formatDate = (datetime: Date) => {
  return datetime.toISOString().substring(0, 19)
}

// Helper function to find current and next tariff
function findCurrentAndNextTariff(data: TariffAndConsumptionData[]): {
  currentTariff: TariffInfo | null;
  nextTariff: TariffInfo | null;
} {
  if (data.length === 0) {
    return { currentTariff: null, nextTariff: null };
  }

  const now = new Date();

  // Sort data by valid_from in ascending order
  const sortedData = [...data].sort(
    (a, b) => new Date(a.valid_from).getTime() - new Date(b.valid_from).getTime()
  );

  // Find current tariff (most recent tariff that has started)
  let currentTariff: TariffInfo | null = null;
  let currentIndex = -1;

  for (let i = sortedData.length - 1; i >= 0; i--) {
    const validFrom = new Date(sortedData[i].valid_from);
    if (validFrom <= now) {
      currentIndex = i;
      const validUntil = i < sortedData.length - 1 ? sortedData[i + 1].valid_from : undefined;
      currentTariff = {
        rate: sortedData[i].value_inc_vat,
        validFrom: sortedData[i].valid_from,
        validUntil,
      };
      break;
    }
  }

  // Find next tariff (first tariff after current one)
  let nextTariff: TariffInfo | null = null;
  if (currentIndex !== -1 && currentIndex < sortedData.length - 1) {
    const nextIndex = currentIndex + 1;
    const validUntil = nextIndex < sortedData.length - 1 ? sortedData[nextIndex + 1].valid_from : undefined;
    nextTariff = {
      rate: sortedData[nextIndex].value_inc_vat,
      validFrom: sortedData[nextIndex].valid_from,
      validUntil,
    };
  }

  return { currentTariff, nextTariff };
}

// Fetch all dashboard data in a single request (MTD) and derive WTD and chart data
export async function fetchAllDashboardData(): Promise<AllDashboardData> {
  const chartStartDate = new Date();
  chartStartDate.setHours(0, 0, 0);

  const chartEndDate = new Date();
  chartEndDate.setDate(chartEndDate.getDate() + 1);
  chartEndDate.setHours(23, 59, 59);

  const now = new Date();
  const monthStart = getMonthStart(now);
  const weekStart = getWeekStart(now);

  // Fetch MTD data once
  const response = await axios.get<TariffAndConsumptionData[]>(
    `${API_BASE_URL}/tariff-rates-with-historic-consumption`,
    {
      params: {
        start_datetime: formatDate(monthStart),
        end_datetime: formatDate(chartEndDate),
      },
    }
  );

  const mtdData = response.data;

  // Calculate MTD cost summary
  const mtdCostSummary = calculateCostSummary(mtdData, 'MTD');

  // Filter for WTD and calculate WTD cost summary
  const wtdData = filterDataByDateRange(mtdData, weekStart, now);
  const wtdCostSummary = calculateCostSummary(wtdData, 'WTD');

  // Filter for Today and calculate Today cost summary
  const todayEndDate = new Date();
  todayEndDate.setHours(23, 59, 59, 999);
  const todayData = filterDataByDateRange(mtdData, chartStartDate, todayEndDate);
  const todayCostSummary = calculateCostSummary(todayData, 'Today');

  // Filter for chart date range and create chart data
  const chartDataFiltered = filterDataByDateRange(mtdData, chartStartDate, chartEndDate);
  const chartData = createChartData(chartDataFiltered);
  const chartCostSummary = calculateCostSummary(chartDataFiltered);

  // Find current and next tariff
  const { currentTariff, nextTariff } = findCurrentAndNextTariff(chartDataFiltered);

  return {
    mtdData,
    mtdCostSummary,
    wtdCostSummary,
    todayCostSummary,
    chartData,
    chartCostSummary,
    currentTariff,
    nextTariff,
  };
}
