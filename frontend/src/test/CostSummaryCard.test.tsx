import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CostSummaryCard from '../components/CostSummaryCard';

describe('CostSummaryCard Component', () => {
  it('renders title and value correctly', () => {
    render(
      <CostSummaryCard
        title="Test Title"
        value="123.45"
        color="#E3E342"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('123.45')).toBeInTheDocument();
  });

  it('renders value with unit when provided', () => {
    render(
      <CostSummaryCard
        title="Total Consumption"
        value="10.50"
        color="#24941B"
        unit=" kWh"
      />
    );

    expect(screen.getByText('Total Consumption')).toBeInTheDocument();
    expect(screen.getByText(/10\.50 kWh/)).toBeInTheDocument();
  });

  it('renders value without unit when not provided', () => {
    render(
      <CostSummaryCard
        title="Total Cost"
        value="£5.25"
        color="#E3E342"
      />
    );

    expect(screen.getByText('£5.25')).toBeInTheDocument();
  });

  it('applies correct color styling', () => {
    const { container } = render(
      <CostSummaryCard
        title="Test"
        value="100"
        color="#FF6B6B"
      />
    );

    const cardDiv = container.querySelector('div');
    expect(cardDiv).toHaveStyle({ border: '2px solid #FF6B6B' });

    const valueElement = screen.getByText('100');
    expect(valueElement).toHaveStyle({ color: '#FF6B6B' });
  });

  it('renders with centered text alignment', () => {
    const { container } = render(
      <CostSummaryCard
        title="Test"
        value="100"
        color="#E3E342"
      />
    );

    const cardDiv = container.querySelector('div');
    expect(cardDiv).toHaveStyle({ textAlign: 'center' });
  });

  it('handles numeric values', () => {
    render(
      <CostSummaryCard
        title="Test"
        value={42}
        color="#E3E342"
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('applies dark theme styling', () => {
    const { container } = render(
      <CostSummaryCard
        title="Test"
        value="100"
        color="#E3E342"
      />
    );

    const cardDiv = container.querySelector('div');
    expect(cardDiv).toHaveStyle({
      backgroundColor: '#262626',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    });
  });

  it('renders title with correct styling', () => {
    render(
      <CostSummaryCard
        title="Average Price"
        value="15.5"
        color="#2A2299"
      />
    );

    const titleElement = screen.getByText('Average Price');
    expect(titleElement).toHaveStyle({
      fontSize: '14px',
      color: '#a0a0a0',
    });
  });

  it('renders value with correct font styling', () => {
    render(
      <CostSummaryCard
        title="Test"
        value="100"
        color="#E3E342"
      />
    );

    const valueElement = screen.getByText('100');
    expect(valueElement).toHaveStyle({
      fontSize: '32px',
      fontWeight: 'bold',
    });
  });
});
