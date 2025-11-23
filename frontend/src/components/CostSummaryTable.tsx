import { CostSummary } from '../services/api';

export type PeriodFilter = 'today' | 'wtd' | 'mtd' | null;

interface CostSummaryTableProps {
  todayCostSummary: CostSummary;
  wtdCostSummary: CostSummary;
  mtdCostSummary: CostSummary;
  selectedPeriod: PeriodFilter;
  onPeriodClick: (period: PeriodFilter) => void;
}

function CostSummaryTable({
  todayCostSummary,
  wtdCostSummary,
  mtdCostSummary,
  selectedPeriod,
  onPeriodClick,
}: CostSummaryTableProps) {
  return (
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
          <tr
            onClick={() => onPeriodClick('today')}
            style={{
              borderBottom: '1px solid #333333',
              cursor: 'pointer',
              backgroundColor: selectedPeriod === 'today' ? '#333333' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedPeriod !== 'today') {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== 'today') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
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
          <tr
            onClick={() => onPeriodClick('wtd')}
            style={{
              borderBottom: '1px solid #333333',
              cursor: 'pointer',
              backgroundColor: selectedPeriod === 'wtd' ? '#333333' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedPeriod !== 'wtd') {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== 'wtd') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
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
          <tr
            onClick={() => onPeriodClick('mtd')}
            style={{
              cursor: 'pointer',
              backgroundColor: selectedPeriod === 'mtd' ? '#333333' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedPeriod !== 'mtd') {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPeriod !== 'mtd') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
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
  );
}

export default CostSummaryTable;
