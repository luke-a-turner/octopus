import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import TariffCard from './components/TariffCard';
import { fetchAllDashboardData, CostSummary, TariffInfo } from './services/api';

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

  useEffect(() => {
    // Fetch all data in a single request
    fetchAllDashboardData()
      .then(allData => {
        setChartData(allData.chartData);
        setWtdCostSummary(allData.wtdCostSummary);
        setMtdCostSummary(allData.mtdCostSummary);
        setTodayCostSummary(allData.todayCostSummary);
        setCurrentTariff(allData.currentTariff);
        setNextTariff(allData.nextTariff);
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
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto 30px auto',
        }}
      >
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#262626',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#1f1f1f' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '11px',
                color: '#909090',
                fontWeight: '500',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '1px solid #404040',
              }}>
                Period
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '11px',
                color: '#909090',
                fontWeight: '500',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '1px solid #404040',
              }}>
                Total Cost
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '11px',
                color: '#909090',
                fontWeight: '500',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderBottom: '1px solid #404040',
              }}>
                Avg Cost/kWh
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Today Row */}
            <tr style={{ borderBottom: '1px solid #333333' }}>
              <td style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#e0e0e0',
                fontWeight: '500',
              }}>
                Today
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#4ECDC4',
                fontWeight: '600',
              }}>
                £{todayCostSummary.totalCost.toFixed(2)}
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#4ECDC4',
                fontWeight: '600',
              }}>
                {todayCostSummary.averageCostPerKwh.toFixed(2)} p
              </td>
            </tr>

            {/* Week to Date Row */}
            <tr style={{ borderBottom: '1px solid #333333' }}>
              <td style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#e0e0e0',
                fontWeight: '500',
              }}>
                Week to Date
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#95E1D3',
                fontWeight: '600',
              }}>
                £{wtdCostSummary.totalCost.toFixed(2)}
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#95E1D3',
                fontWeight: '600',
              }}>
                {wtdCostSummary.averageCostPerKwh.toFixed(2)} p
              </td>
            </tr>

            {/* Month to Date Row */}
            <tr>
              <td style={{
                padding: '12px 16px',
                fontSize: '14px',
                color: '#e0e0e0',
                fontWeight: '500',
              }}>
                Month to Date
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#F38181',
                fontWeight: '600',
              }}>
                £{mtdCostSummary.totalCost.toFixed(2)}
              </td>
              <td style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '16px',
                color: '#F38181',
                fontWeight: '600',
              }}>
                {mtdCostSummary.averageCostPerKwh.toFixed(2)} p
              </td>
            </tr>
          </tbody>
        </table>
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
