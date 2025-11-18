import { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import TariffCard from './components/TariffCard';
import CostSummaryTable, { PeriodFilter } from './components/CostSummaryTable';
import DetailGrid, { DetailGridRow } from './components/DetailGrid';
import { fetchAllDashboardData, CostSummary, TariffInfo } from './services/api';

interface TariffAndConsumptionData {
  valid_from: string;
  value_inc_vat: number;
  interval_start: string;
  consumption: number;
}

function App() {
  const [chartData, setChartData] = useState<Data[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wtdCostSummary, setWtdCostSummary] = useState<CostSummary>({
    totalCost: 0,
    averageCostPerKwh: 0,
  });
  const [mtdCostSummary, setMtdCostSummary] = useState<CostSummary>({
    totalCost: 0,
    averageCostPerKwh: 0,
  });
  const [todayCostSummary, setTodayCostSummary] = useState<CostSummary>({
    totalCost: 0,
    averageCostPerKwh: 0,
  });
  const [currentTariff, setCurrentTariff] = useState<TariffInfo | null>(null);
  const [nextTariff, setNextTariff] = useState<TariffInfo | null>(null);
  const [mtdData, setMtdData] = useState<TariffAndConsumptionData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(null);

  useEffect(() => {
    // Fetch all data in a single request
    const fetchData = () => {
      fetchAllDashboardData()
        .then(allData => {
          setChartData(allData.chartData);
          setWtdCostSummary(allData.wtdCostSummary);
          setMtdCostSummary(allData.mtdCostSummary);
          setTodayCostSummary(allData.todayCostSummary);
          setCurrentTariff(allData.currentTariff);
          setNextTariff(allData.nextTariff);
          setMtdData(allData.mtdData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
        });
    };

    // Initial fetch
    fetchData();

    // Set up interval to refresh every 30 minutes (30 * 60 * 1000 milliseconds)
    const intervalId = setInterval(fetchData, 30 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Helper function to get start of week (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Transform and filter data for the detail grid
  const detailGridData: DetailGridRow[] = useMemo(() => {
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

    // Transform to DetailGridRow format
    return filteredData.map(item => {
      const dateTime = new Date(item.valid_from);
      const cost = (item.consumption * item.value_inc_vat) / 100; // Convert pence to pounds

      return {
        date: dateTime.toLocaleDateString('en-GB'),
        time: dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        rate: item.value_inc_vat,
        consumption: item.consumption,
        cost,
        dateTime,
      };
    }).sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime()); // Sort by most recent first
  }, [mtdData, selectedPeriod]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#1a1a1a',
          color: '#e0e0e0',
          fontSize: '24px',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="App"
      style={{
        padding: '20px',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Octopus Energy Dashboard</h1>

      {/* Current and Next Tariff */}
      {(currentTariff || nextTariff) && (
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto 30px auto',
          }}
        >
          <h2 style={{
            fontSize: '13px',
            color: '#808080',
            marginBottom: '10px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Tariffs
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            {currentTariff && (
              <TariffCard
                title="Current"
                rate={currentTariff.rate}
                validFrom={currentTariff.validFrom}
                validUntil={currentTariff.validUntil}
                color="#FFD700"
              />
            )}
            {nextTariff && (
              <TariffCard
                title="Next"
                rate={nextTariff.rate}
                validFrom={nextTariff.validFrom}
                validUntil={nextTariff.validUntil}
                color="#FFA500"
              />
            )}
          </div>
        </div>
      )}

      {/* Cost Summary Table */}
      <CostSummaryTable
        todayCostSummary={todayCostSummary}
        wtdCostSummary={wtdCostSummary}
        mtdCostSummary={mtdCostSummary}
        selectedPeriod={selectedPeriod}
        onPeriodClick={setSelectedPeriod}
      />

      {/* Detail Grid */}
      {detailGridData.length > 0 && (
        <DetailGrid data={detailGridData} />
      )}

      <Plot
        data={chartData}
        layout={{
          title: {
            text: 'Tariff Prices and Smart Meter Usage',
            font: { color: '#e0e0e0' },
          },
          xaxis: {
            title: { text: 'Time', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040',
            type: 'date',
            tickformat: '%H:%M',
          },
          yaxis: {
            title: { text: 'Price (p/kWh)', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040',
          },
          yaxis2: {
            title: { text: 'Consumption (kWh)', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040',
            overlaying: 'y',
            side: 'right',
          },
          barmode: 'group',
          height: 600,
          paper_bgcolor: '#1a1a1a',
          plot_bgcolor: '#262626',
          legend: {
            font: { color: '#e0e0e0' },
          },
        }}
        config={{ responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default App;
