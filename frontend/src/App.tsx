import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { Data } from 'plotly.js';

interface TariffData {
  valid_from: string;
  value_inc_vat: number;
}

interface UsageData {
  interval_start: string;
  consumption: number;
}

interface GroupedItem {
  time: string;
  value: number;
  dateTime: Date;
}

function App() {
  const [chartData, setChartData] = useState<Data[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch both tariff data and smart meter usage data
    Promise.all([
      axios.get<TariffData[]>('http://localhost:8000/tariff-data-today-and-tomorrow'),
      axios.get<UsageData[]>('http://localhost:8000/smart-meter-usage-historic')
    ])
      .then(([tariffResponse, usageResponse]) => {
        const tariffData = tariffResponse.data;
        const usageData = usageResponse.data;

        // Group tariff data by date and prepare data for plotting
        const grouped: Record<string, GroupedItem[]> = tariffData.reduce((acc, item) => {
          const dateTime = new Date(item.valid_from);
          const dateKey = dateTime.toISOString().split('T')[0];
          const time = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push({
            time,
            value: item.value_inc_vat,
            dateTime
          });
          return acc;
        }, {} as Record<string, GroupedItem[]>);

        // Create a trace for each date (bar chart)
        const colors = ['#E3E342', '#2A2299', '#24941B'];
        const traces: Data[] = Object.entries(grouped).map(([date, items], index) => {
          items.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
          return {
            x: items.map(item => item.time),
            y: items.map(item => item.value),
            type: 'bar',
            name: date,
            marker: {
              color: colors[index % colors.length]
            }
          };
        });

        // Process smart meter usage data for scatter plot
        const usageProcessed = usageData.map(item => {
          const dateTime = new Date(item.interval_start);
          const time = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          return {
            time,
            consumption: item.consumption,
            dateTime
          };
        }).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        // Add scatter plot trace for smart meter usage
        if (usageProcessed.length > 0) {
          traces.push({
            x: usageProcessed.map(item => item.time),
            y: usageProcessed.map(item => item.consumption),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Smart Meter Usage (kWh)',
            yaxis: 'y2',
            line: {
              color: '#FF6B6B',
              width: 2
            },
            marker: {
              size: 6,
              color: '#FF6B6B'
            }
          } as Data);
        }

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
        Octopus Energy Agile Tariff Data
      </h1>
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
            title: { text: 'Usage (kWh)', font: { color: '#e0e0e0' } },
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
