import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
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

interface CostSummary {
  totalCost: number;
  totalConsumption: number;
  averagePrice: number;
  itemCount: number;
}

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
    // Fetch both tariff data and smart meter usage data
    Promise.all([
      axios.get<TariffAndConsumptionData[]>('http://localhost:8000/tariff-rates-with-historic-consumption?start_datetime=2025-11-03T00:00:00&end_datetime=2025-11-05T23:59:59'),
    ])
      .then(([tariffConsumptionResponse]) => {
        const tariffConsumptionData = tariffConsumptionResponse.data;

        // Group tariff data by date and prepare data for plotting
        const grouped: Record<string, GroupedItem[]> = tariffConsumptionData.reduce((acc, item) => {
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
            dateTime
          });
          return acc;
        }, {} as Record<string, GroupedItem[]>);

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
              width: 2
            },
            marker: {
              color: tariffColors[index % tariffColors.length]
            }
          };
        });

        const consumptionColors = ['#75DB0D', '#67A626', '#6B8F46']
        const consumptionTraces: Data[] = Object.entries(grouped).map(([date, items], index) => {
          items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
          return {
            x: items.map(item => item.time),
            y: items.map(item => item.consumption),
            type: 'bar',
            name: `${date} consumption`,
            yaxis: 'y2',
            marker: {
              size: 6,
              color: consumptionColors[index % tariffColors.length]
            }
          };
        });

        const traces = [...tariffTraces, ...consumptionTraces]

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

        setCostSummary({
          totalCost: totalCost / 100, // Convert pence to pounds
          totalConsumption,
          averagePrice,
          itemCount: timeIntervalCount,
        });

        setChartData(traces);
        setLoading(false);
      })
      .catch(error => {
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
        {/* Total Cost Card */}
        <div style={{
          backgroundColor: '#262626',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #E3E342',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#a0a0a0' }}>
            Total Cost Today
          </h3>
          <p style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#E3E342'
          }}>
            £{costSummary.totalCost.toFixed(2)}
          </p>
        </div>

        {/* Total Consumption Card */}
        <div style={{
          backgroundColor: '#262626',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #24941B',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#a0a0a0' }}>
            Total Consumption
          </h3>
          <p style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#24941B'
          }}>
            {costSummary.totalConsumption.toFixed(2)} kWh
          </p>
        </div>

        {/* Cost per kWh Card */}
        <div style={{
          backgroundColor: '#262626',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #FF6B6B',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#a0a0a0' }}>
            Avg Cost per kWh
          </h3>
          <p style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FF6B6B'
          }}>
            {costSummary.totalConsumption > 0
              ? (costSummary.totalCost / costSummary.totalConsumption).toFixed(2)
              : '0.00'} p
          </p>
        </div>
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
