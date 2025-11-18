import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostSummaryTable, { PeriodFilter } from '../components/CostSummaryTable';
import { CostSummary } from '../services/api';

describe('CostSummaryTable Component', () => {
  const mockTodayCostSummary: CostSummary = {
    totalCost: 1.23,
    averageCostPerKwh: 15.5,
  };

  const mockWtdCostSummary: CostSummary = {
    totalCost: 8.45,
    averageCostPerKwh: 16.2,
  };

  const mockMtdCostSummary: CostSummary = {
    totalCost: 25.67,
    averageCostPerKwh: 14.8,
  };

  const mockOnPeriodClick = vi.fn();

  it('renders all period rows', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Week to Date')).toBeInTheDocument();
    expect(screen.getByText('Month to Date')).toBeInTheDocument();
  });

  it('displays correct cost values', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('£1.23')).toBeInTheDocument();
    expect(screen.getByText('£8.45')).toBeInTheDocument();
    expect(screen.getByText('£25.67')).toBeInTheDocument();
  });

  it('displays correct average cost per kWh', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('15.50 p')).toBeInTheDocument();
    expect(screen.getByText('16.20 p')).toBeInTheDocument();
    expect(screen.getByText('14.80 p')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Avg Cost/kWh')).toBeInTheDocument();
  });

  it('calls onPeriodClick with "today" when Today row is clicked', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const todayRow = screen.getByText('Today').closest('tr');
    fireEvent.click(todayRow!);

    expect(mockOnPeriodClick).toHaveBeenCalledWith('today');
  });

  it('calls onPeriodClick with "wtd" when Week to Date row is clicked', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const wtdRow = screen.getByText('Week to Date').closest('tr');
    fireEvent.click(wtdRow!);

    expect(mockOnPeriodClick).toHaveBeenCalledWith('wtd');
  });

  it('calls onPeriodClick with "mtd" when Month to Date row is clicked', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const mtdRow = screen.getByText('Month to Date').closest('tr');
    fireEvent.click(mtdRow!);

    expect(mockOnPeriodClick).toHaveBeenCalledWith('mtd');
  });

  it('calls onPeriodClick with null when selected row is clicked again', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={'today'}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const todayRow = screen.getByText('Today').closest('tr');
    fireEvent.click(todayRow!);

    expect(mockOnPeriodClick).toHaveBeenCalledWith(null);
  });

  it('highlights selected row', () => {
    const { container } = render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={'wtd'}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const wtdRow = screen.getByText('Week to Date').closest('tr');
    expect(wtdRow).toHaveStyle({ backgroundColor: '#333333' });
  });

  it('does not highlight non-selected rows', () => {
    const { container } = render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={'wtd'}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const todayRow = screen.getByText('Today').closest('tr');
    const mtdRow = screen.getByText('Month to Date').closest('tr');

    // Non-selected rows have transparent background (not #333333)
    expect(todayRow?.style.backgroundColor).not.toBe('#333333');
    expect(mtdRow?.style.backgroundColor).not.toBe('#333333');
  });

  it('applies cursor pointer style to all rows', () => {
    render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const todayRow = screen.getByText('Today').closest('tr');
    const wtdRow = screen.getByText('Week to Date').closest('tr');
    const mtdRow = screen.getByText('Month to Date').closest('tr');

    expect(todayRow).toHaveStyle({ cursor: 'pointer' });
    expect(wtdRow).toHaveStyle({ cursor: 'pointer' });
    expect(mtdRow).toHaveStyle({ cursor: 'pointer' });
  });

  it('applies dark theme styling', () => {
    const { container } = render(
      <CostSummaryTable
        todayCostSummary={mockTodayCostSummary}
        wtdCostSummary={mockWtdCostSummary}
        mtdCostSummary={mockMtdCostSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const table = container.querySelector('table');
    expect(table).toHaveStyle({
      backgroundColor: '#262626',
      borderRadius: '6px',
    });
  });

  it('formats zero values correctly', () => {
    const zeroSummary: CostSummary = {
      totalCost: 0,
      averageCostPerKwh: 0,
    };

    render(
      <CostSummaryTable
        todayCostSummary={zeroSummary}
        wtdCostSummary={zeroSummary}
        mtdCostSummary={zeroSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    const costElements = screen.getAllByText('£0.00');
    const avgElements = screen.getAllByText('0.00 p');

    expect(costElements).toHaveLength(3);
    expect(avgElements).toHaveLength(3);
  });

  it('handles large numbers correctly', () => {
    const largeSummary: CostSummary = {
      totalCost: 1234.56,
      averageCostPerKwh: 99.99,
    };

    render(
      <CostSummaryTable
        todayCostSummary={largeSummary}
        wtdCostSummary={largeSummary}
        mtdCostSummary={largeSummary}
        selectedPeriod={null}
        onPeriodClick={mockOnPeriodClick}
      />
    );

    expect(screen.getAllByText('£1234.56')).toHaveLength(3);
    expect(screen.getAllByText('99.99 p')).toHaveLength(3);
  });
});
