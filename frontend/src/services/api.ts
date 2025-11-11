import axios from 'axios';
import { Data } from 'plotly.js';

interface TariffAndConsumptionData {
  valid_from: string;
  value_inc_vat: number;
  interval_start: string;
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
  totalConsumption: number;
  averagePrice: number;
  itemCount: number;
}

export interface DashboardData {
  chartData: Data[];
  costSummary: CostSummary;
}

// to expose a local app on network, you must use ip:port instead of localhost
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function fetchDashboardData(
  startDateTime: string,
  endDateTime: string
): Promise<DashboardData> {
  const response = await axios.get<TariffAndConsumptionData[]>(
    `${API_BASE_URL}/tariff-rates-with-historic-consumption`,
    {
      params: {
        start_datetime: startDateTime,
        end_datetime: endDateTime,
      },
    }
  );

  const tariffConsumptionData = response.data;

  // Group tariff data by date and prepare data for plotting
  const grouped: Record<string, GroupedItem[]> = tariffConsumptionData.reduce(
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
      x: items.map(item => item.time),
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
          x: items.map(item => item.time),
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

  const chartData = [...tariffTraces, ...consumptionTraces];

  // Calculate cost summary
  let totalCost = 0;
  let totalConsumption = 0;
  let totalPrice = 0;
  let timeIntervalCount = 0;

  tariffConsumptionData.forEach(timeInterval => {
    // Cost in pence = consumption (kWh) * price (p/kWh)
    const cost = timeInterval.consumption * timeInterval.value_inc_vat;
    totalCost += cost;
    totalConsumption += timeInterval.consumption;
    totalPrice += timeInterval.value_inc_vat;
    timeIntervalCount++;
  });

  const averagePrice = timeIntervalCount > 0 ? totalPrice / timeIntervalCount : 0;

  const costSummary: CostSummary = {
    totalCost: totalCost / 100, // Convert pence to pounds
    totalConsumption,
    averagePrice,
    itemCount: timeIntervalCount,
  };

  return {
    chartData,
    costSummary,
  };
}
