interface TariffCardProps {
  title: string;
  rate: number;
  validFrom: string;
  validUntil?: string;
  color: string;
}

function TariffCard({ title, rate, validFrom, validUntil, color }: TariffCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    return `${time}, ${dateStr}`;
  };

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
            <td colSpan={2} style={{
              fontSize: '11px',
              color: '#909090',
              fontWeight: '500',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              padding: '0 0 8px 0',
              textAlign: 'center'
            }}>
              {title}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{
              fontSize: '22px',
              fontWeight: '600',
              color: color,
              lineHeight: '1.2',
              padding: '0 0 8px 0',
              textAlign: 'center'
            }}>
              {rate.toFixed(2)} p
            </td>
          </tr>
          <tr>
            <td style={{
              fontSize: '9px',
              color: '#808080',
              padding: '2px 4px 2px 0',
              textAlign: 'left',
              fontWeight: '500'
            }}>
              FROM
            </td>
            <td style={{
              fontSize: '10px',
              color: '#b0b0b0',
              padding: '2px 0 2px 4px',
              textAlign: 'right'
            }}>
              {formatTime(validFrom)}
            </td>
          </tr>
          {validUntil && (
            <tr>
              <td style={{
                fontSize: '9px',
                color: '#808080',
                padding: '2px 4px 2px 0',
                textAlign: 'left',
                fontWeight: '500'
              }}>
                UNTIL
              </td>
              <td style={{
                fontSize: '10px',
                color: '#b0b0b0',
                padding: '2px 0 2px 4px',
                textAlign: 'right'
              }}>
                {formatTime(validUntil)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TariffCard;
