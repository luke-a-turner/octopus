import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DetailGrid, { DetailGridRow } from '../components/DetailGrid';

describe('DetailGrid Component', () => {
  const mockData: DetailGridRow[] = [
    {
      date: '01/01/2024',
      time: '00:00',
      rate: 15.5,
      consumption: 0.5,
      cost: 0.0775,
      dateTime: new Date('2024-01-01T00:00:00'),
    },
    {
      date: '01/01/2024',
      time: '00:30',
      rate: 16.2,
      consumption: 0.6,
      cost: 0.0972,
      dateTime: new Date('2024-01-01T00:30:00'),
    },
    {
      date: '01/01/2024',
      time: '01:00',
      rate: 14.8,
      consumption: 0.4,
      cost: 0.0592,
      dateTime: new Date('2024-01-01T01:00:00'),
    },
  ];

  it('renders the detail data heading', () => {
    render(<DetailGrid data={mockData} />);
    expect(screen.getByText('Detail Data')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    render(<DetailGrid data={mockData} />);

    expect(screen.getByText('Total Consumption')).toBeInTheDocument();
    expect(screen.getByText('Weighted Avg Rate')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
  });

  it('calculates total consumption correctly', () => {
    render(<DetailGrid data={mockData} />);

    // Total consumption = 0.5 + 0.6 + 0.4 = 1.5 kWh
    expect(screen.getByText(/1\.500 kWh/)).toBeInTheDocument();
  });

  it('calculates weighted average rate correctly', () => {
    render(<DetailGrid data={mockData} />);

    // Weighted avg = (15.5*0.5 + 16.2*0.6 + 14.8*0.4) / 1.5 = 15.59 p/kWh (rounded)
    expect(screen.getByText(/15\.59 p\/kWh/)).toBeInTheDocument();
  });

  it('calculates total cost correctly', () => {
    render(<DetailGrid data={mockData} />);

    // Total cost = 0.0775 + 0.0972 + 0.0592 = 0.2339 = £0.23
    expect(screen.getByText(/£0\.23/)).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<DetailGrid data={[]} />);

    expect(screen.getByText('Detail Data')).toBeInTheDocument();
    expect(screen.getByText(/0\.000 kWh/)).toBeInTheDocument();
    expect(screen.getByText(/0\.00 p\/kWh/)).toBeInTheDocument();
    expect(screen.getByText(/£0\.00/)).toBeInTheDocument();
  });

  it('applies dark theme styling', () => {
    const { container } = render(<DetailGrid data={mockData} />);

    const heading = screen.getByText('Detail Data');
    expect(heading).toHaveStyle({
      fontSize: '13px',
      color: '#808080',
    });
  });

  it('renders AG Grid container', () => {
    const { container } = render(<DetailGrid data={mockData} />);

    const gridContainer = container.querySelector('.ag-theme-alpine-dark');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveStyle({ height: '500px' });
  });

  it('handles single data point', () => {
    const singleData: DetailGridRow[] = [
      {
        date: '01/01/2024',
        time: '00:00',
        rate: 20.0,
        consumption: 1.0,
        cost: 0.20,
        dateTime: new Date('2024-01-01T00:00:00'),
      },
    ];

    render(<DetailGrid data={singleData} />);

    expect(screen.getByText(/1\.000 kWh/)).toBeInTheDocument();
    expect(screen.getByText(/20\.00 p\/kWh/)).toBeInTheDocument();
    expect(screen.getByText(/£0\.20/)).toBeInTheDocument();
  });

  it('handles data with zero consumption', () => {
    const zeroConsumptionData: DetailGridRow[] = [
      {
        date: '01/01/2024',
        time: '00:00',
        rate: 15.5,
        consumption: 0,
        cost: 0,
        dateTime: new Date('2024-01-01T00:00:00'),
      },
    ];

    render(<DetailGrid data={zeroConsumptionData} />);

    expect(screen.getByText(/0\.000 kWh/)).toBeInTheDocument();
    expect(screen.getByText(/0\.00 p\/kWh/)).toBeInTheDocument(); // Weighted avg is 0 when consumption is 0
    expect(screen.getByText(/£0\.00/)).toBeInTheDocument();
  });

  it('formats decimal values correctly', () => {
    const preciseData: DetailGridRow[] = [
      {
        date: '01/01/2024',
        time: '00:00',
        rate: 15.555,
        consumption: 0.123456,
        cost: 0.019209,
        dateTime: new Date('2024-01-01T00:00:00'),
      },
    ];

    render(<DetailGrid data={preciseData} />);

    // Consumption should be 3 decimal places
    expect(screen.getByText(/0\.123 kWh/)).toBeInTheDocument();
    // Rate should be 2 decimal places (15.555 rounds to 15.55)
    expect(screen.getByText(/15\.55 p\/kWh/)).toBeInTheDocument();
    // Cost should be 2 decimal places
    expect(screen.getByText(/£0\.02/)).toBeInTheDocument();
  });
});
