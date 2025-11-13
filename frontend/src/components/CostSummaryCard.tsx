interface CostSummaryCardProps {
  title: string;
  value: string | number;
  color: string;
  unit?: string;
}

function CostSummaryCard({ title, value, color, unit = '' }: CostSummaryCardProps) {
  return (
    <div style={{
      backgroundColor: '#262626',
      padding: '12px 16px',
      borderRadius: '6px',
      border: `1.5px solid ${color}`,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <tbody>
          <tr>
            <td style={{
              fontSize: '11px',
              color: '#909090',
              fontWeight: '500',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              padding: '0 0 6px 0',
              textAlign: 'left'
            }}>
              {title}
            </td>
          </tr>
          <tr>
            <td style={{
              fontSize: '22px',
              fontWeight: '600',
              color: color,
              lineHeight: '1.2',
              padding: 0,
              textAlign: 'center'
            }}>
              {value}{unit}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CostSummaryCard;
