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
      padding: '20px',
      borderRadius: '8px',
      border: `2px solid ${color}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      textAlign: 'center'
    }}>
      <h3 style={{
        margin: '0 0 10px 0',
        fontSize: '14px',
        color: '#a0a0a0'
      }}>
        {title}
      </h3>
      <p style={{
        margin: 0,
        fontSize: '32px',
        fontWeight: 'bold',
        color: color
      }}>
        {value}{unit}
      </p>
    </div>
  );
}

export default CostSummaryCard;
