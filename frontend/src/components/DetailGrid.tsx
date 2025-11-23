import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../ag-grid-theme.css';
import { useMemo } from 'react';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface DetailGridRow {
  date: string;
  consumption: number;
  cost: number;
  averageRate: number;
  averageCostPerKwh: number;
  delta: number;
  dateTime: Date;
}

interface DetailGridProps {
  data: DetailGridRow[];
}

function DetailGrid({ data }: DetailGridProps) {
  const columnDefs: ColDef<DetailGridRow>[] = useMemo(
    () => [
      {
        field: 'date',
        headerName: 'Date',
        sortable: true,
        filter: true,
        width: 150,
      },
      {
        field: 'consumption',
        headerName: 'Consumption (kWh)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(3),
        width: 180,
      },
      {
        field: 'cost',
        headerName: 'Cost (£)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => `£${params.value?.toFixed(2)}`,
        width: 130,
      },
      {
        field: 'averageRate',
        headerName: 'Avg Rate (p/kWh)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(2),
        width: 160,
      },
      {
        field: 'averageCostPerKwh',
        headerName: 'Avg Cost/kWh (p)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(2),
        width: 160,
      },
      {
        field: 'delta',
        headerName: 'Delta (p)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(2),
        width: 120,
      },
    ],
    []
  );

  // Calculate totals and averages
  const { totalConsumption, averageRate, averageCostPerKwh, delta, totalCost } = useMemo(() => {
    let totalConsumption = 0;
    let totalCost = 0;
    let rateSum = 0;

    data.forEach(row => {
      totalConsumption += row.consumption;
      totalCost += row.cost;
      rateSum += row.averageRate;
    });

    // Average rate in pence: simple average across all days
    const averageRate = data.length > 0 ? rateSum / data.length : 0;
    // Average cost per kWh in pence
    const averageCostPerKwh = totalConsumption > 0 ? (totalCost * 100) / totalConsumption : 0;
    // Delta between cost and rate
    const delta = averageCostPerKwh - averageRate;

    return {
      totalConsumption,
      averageRate,
      averageCostPerKwh,
      delta,
      totalCost,
    };
  }, [data]);

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto 30px auto',
      }}
    >
      <h2
        style={{
          fontSize: '13px',
          color: '#808080',
          marginBottom: '10px',
          fontWeight: '500',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        Detail Data
      </h2>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: '#262626',
            padding: '12px 16px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#909090',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total Consumption
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#4ECDC4',
              fontWeight: '600',
            }}
          >
            {totalConsumption.toFixed(3)} kWh
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#262626',
            padding: '12px 16px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#909090',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Avg Rate
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#FFD700',
              fontWeight: '600',
            }}
          >
            {averageRate.toFixed(2)} p/kWh
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#262626',
            padding: '12px 16px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#909090',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Avg Cost/kWh
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#95E1D3',
              fontWeight: '600',
            }}
          >
            {averageCostPerKwh.toFixed(2)} p/kWh
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#262626',
            padding: '12px 16px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#909090',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Delta
          </div>
          <div
            style={{
              fontSize: '20px',
              color: delta >= 0 ? '#FFA500' : '#4ECDC4',
              fontWeight: '600',
            }}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(2)} p
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#262626',
            padding: '12px 16px',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#909090',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total Cost
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#F38181',
              fontWeight: '600',
            }}
          >
            £{totalCost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-alpine-dark"
        style={{
          height: '500px',
          width: '100%',
        }}
      >
        <AgGridReact<DetailGridRow>
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          domLayout="normal"
        />
      </div>
    </div>
  );
}

export default DetailGrid;
