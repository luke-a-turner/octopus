import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../ag-grid-theme.css';
import { useMemo } from 'react';

export interface DetailGridRow {
  date: string;
  time: string;
  rate: number;
  consumption: number;
  cost: number;
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
        width: 120,
      },
      {
        field: 'time',
        headerName: 'Time',
        sortable: true,
        filter: true,
        width: 100,
      },
      {
        field: 'rate',
        headerName: 'Rate (p/kWh)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(2),
        width: 130,
      },
      {
        field: 'consumption',
        headerName: 'Consumption (kWh)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => params.value?.toFixed(3),
        width: 170,
      },
      {
        field: 'cost',
        headerName: 'Cost (£)',
        sortable: true,
        filter: 'agNumberColumnFilter',
        valueFormatter: params => `£${params.value?.toFixed(2)}`,
        width: 120,
      },
    ],
    []
  );

  // Calculate totals and averages
  const { totalConsumption, weightedAverageRate, totalCost } = useMemo(() => {
    let totalConsumption = 0;
    let totalCost = 0;
    let weightedRateSum = 0;

    data.forEach(row => {
      totalConsumption += row.consumption;
      totalCost += row.cost;
      weightedRateSum += row.rate * row.consumption;
    });

    const weightedAverageRate = totalConsumption > 0 ? weightedRateSum / totalConsumption : 0;

    return {
      totalConsumption,
      weightedAverageRate,
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
            Weighted Avg Rate
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#95E1D3',
              fontWeight: '600',
            }}
          >
            {weightedAverageRate.toFixed(2)} p/kWh
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
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          domLayout="normal"
        />
      </div>
    </div>
  );
}

export default DetailGrid;
