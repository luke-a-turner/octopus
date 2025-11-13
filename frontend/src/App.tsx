import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import CostSummaryCard from './components/CostSummaryCard';
import { fetchAllDashboardData, CostSummary } from './services/api';

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

  useEffect(() => {
    // Fetch all data in a single request
    fetchAllDashboardData()
      .then(allData => {
        setChartData(allData.chartData);
        setWtdCostSummary(allData.wtdCostSummary);
        setMtdCostSummary(allData.mtdCostSummary);
        setTodayCostSummary(allData.todayCostSummary);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

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

      {/* Cost Summary Cards */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 30px auto',
        }}
      >
        {/* Today Section */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '13px',
            color: '#808080',
            marginBottom: '10px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Today
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            <CostSummaryCard
              title="Total Cost"
              value={`£${todayCostSummary.totalCost.toFixed(2)}`}
              color="#4ECDC4"
            />
            <CostSummaryCard
              title="Avg Cost/kWh"
              value={todayCostSummary.averageCostPerKwh.toFixed(2)}
              color="#4ECDC4"
              unit=" p"
            />
          </div>
        </div>

        {/* Week to Date Section */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '13px',
            color: '#808080',
            marginBottom: '10px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Week to Date
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            <CostSummaryCard
              title="Total Cost"
              value={`£${wtdCostSummary.totalCost.toFixed(2)}`}
              color="#95E1D3"
            />
            <CostSummaryCard
              title="Avg Cost/kWh"
              value={wtdCostSummary.averageCostPerKwh.toFixed(2)}
              color="#95E1D3"
              unit=" p"
            />
          </div>
        </div>

        {/* Month to Date Section */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '13px',
            color: '#808080',
            marginBottom: '10px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Month to Date
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}>
            <CostSummaryCard
              title="Total Cost"
              value={`£${mtdCostSummary.totalCost.toFixed(2)}`}
              color="#F38181"
            />
            <CostSummaryCard
              title="Avg Cost/kWh"
              value={mtdCostSummary.averageCostPerKwh.toFixed(2)}
              color="#F38181"
              unit=" p"
            />
          </div>
        </div>
      </div>

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
