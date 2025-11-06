import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import CostSummaryCard from './components/CostSummaryCard';
import { fetchDashboardData, CostSummary } from './services/api';

function App() {
  const [chartData, setChartData] = useState<Data[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [costSummary, setCostSummary] = useState<CostSummary>({
    totalCost: 0,
    totalConsumption: 0,
    averagePrice: 0,
    itemCount: 0,
  });

  useEffect(() => {
    fetchDashboardData('2025-11-05T00:00:00', '2025-11-07T23:59:59')
      .then((data) => {
        setChartData(data.chartData);
        setCostSummary(data.costSummary);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="App" style={{
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Octopus Energy Dashboard
      </h1>

      {/* Cost Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
        maxWidth: '800px',
        margin: '0 auto 30px auto',
      }}>
        <CostSummaryCard
          title="Total Cost Today"
          value={`£${costSummary.totalCost.toFixed(2)}`}
          color="#E3E342"
        />
        <CostSummaryCard
          title="Total Consumption"
          value={costSummary.totalConsumption.toFixed(2)}
          color="#24941B"
          unit=" kWh"
        />
        <CostSummaryCard
          title="Avg Cost per kWh"
          value={costSummary.totalConsumption > 0
            ? (costSummary.totalCost / costSummary.totalConsumption).toFixed(2)
            : '0.00'}
          color="#FF6B6B"
          unit=" p"
        />
      </div>

      <Plot
        data={chartData}
        layout={{
          title: {
            text: 'Tariff Prices and Smart Meter Usage',
            font: { color: '#e0e0e0' }
          },
          xaxis: {
            title: { text: 'Time', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040'
          },
          yaxis: {
            title: { text: 'Price (p/kWh)', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040'
          },
          yaxis2: {
            title: { text: 'Consumption (kWh)', font: { color: '#e0e0e0' } },
            tickfont: { color: '#e0e0e0' },
            gridcolor: '#404040',
            overlaying: 'y',
            side: 'right'
          },
          barmode: 'group',
          height: 600,
          paper_bgcolor: '#1a1a1a',
          plot_bgcolor: '#262626',
          legend: {
            font: { color: '#e0e0e0' }
          }
        }}
        config={{ responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export default App;
