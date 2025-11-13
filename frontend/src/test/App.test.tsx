import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as apiService from '../services/api';

// Mock the API service
vi.mock('../services/api');
const mockedApiService = vi.mocked(apiService);

// Mock react-plotly.js to avoid WebGL issues in tests
vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plot-component">Mocked Plot</div>,
}));

describe('App Component', () => {
  const mockAllDashboardData = {
    mtdData: [
      {
        valid_from: '2024-01-15T00:00:00Z',
        value_inc_vat: 20.0,
        consumption: 2.0,
      },
    ],
    mtdCostSummary: {
      totalCost: 5.25,
      averageCostPerKwh: 25.5,
      period: 'MTD',
    },
    wtdCostSummary: {
      totalCost: 2.50,
      averageCostPerKwh: 22.0,
      period: 'WTD',
    },
    todayCostSummary: {
      totalCost: 1.25,
      averageCostPerKwh: 20.0,
      period: 'Today',
    },
    chartData: [
      {
        x: ['00:00', '00:30'],
        y: [15.5, 16.2],
        type: 'scattergl',
        mode: 'lines+markers',
        name: '2024-01-15 price',
      },
    ],
    chartCostSummary: {
      totalCost: 1.25,
      averageCostPerKwh: 15.8,
    },
    currentTariff: {
      rate: 18.5,
      validFrom: '2024-01-15T12:00:00Z',
      validUntil: '2024-01-15T12:30:00Z',
    },
    nextTariff: {
      rate: 24.5,
      validFrom: '2024-01-15T12:30:00Z',
      validUntil: '2024-01-15T13:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock fetchAllDashboardData to delay response
    mockedApiService.fetchAllDashboardData.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard title after loading', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Octopus Energy Dashboard')).toBeInTheDocument();
    });
  });

  it('renders plot component after data loads', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plot-component')).toBeInTheDocument();
    });
  });

  it('renders Today, WTD and MTD cost summary in table after data loads', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      // Check for table headers (case-insensitive due to CSS text-transform)
      expect(screen.getByText('Period')).toBeInTheDocument();
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('Avg Cost/kWh')).toBeInTheDocument();

      // Check for period labels in table rows
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Week to Date')).toBeInTheDocument();
      expect(screen.getByText('Month to Date')).toBeInTheDocument();
    });
  });

  it('displays Today cost summary values correctly', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('£1.25')).toBeInTheDocument(); // Today total cost
      expect(screen.getByText('20.00 p')).toBeInTheDocument(); // Today avg cost per kWh
    });
  });

  it('displays WTD cost summary values correctly', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('£2.50')).toBeInTheDocument(); // WTD total cost
      expect(screen.getByText('22.00 p')).toBeInTheDocument(); // WTD avg cost per kWh
    });
  });

  it('displays MTD cost summary values correctly', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('£5.25')).toBeInTheDocument(); // MTD total cost
      expect(screen.getByText('25.50 p')).toBeInTheDocument(); // MTD avg cost per kWh
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock fetchAllDashboardData to reject
    mockedApiService.fetchAllDashboardData.mockRejectedValue(new Error('API Error'));

    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      // Should not show loading after error
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('calls fetchAllDashboardData once on mount', async () => {
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(mockedApiService.fetchAllDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  it('does not display Total Consumption card', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Total Consumption')).not.toBeInTheDocument();
    });
  });

  it('displays current and next tariff cards', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      // Text is transformed to uppercase via CSS, so check for the original case
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('18.50 p')).toBeInTheDocument();
      expect(screen.getByText('24.50 p')).toBeInTheDocument();
    });
  });

  it('displays tariff time information', async () => {
    // Mock successful API response
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockAllDashboardData);

    render(<App />);

    await waitFor(() => {
      // Check for FROM and UNTIL labels
      const fromLabels = screen.getAllByText('FROM');
      const untilLabels = screen.getAllByText('UNTIL');
      expect(fromLabels.length).toBeGreaterThan(0);
      expect(untilLabels.length).toBeGreaterThan(0);
    });
  });

  it('does not display tariff section when no tariff data available', async () => {
    // Mock with no tariff data
    const mockDataNoTariffs = {
      ...mockAllDashboardData,
      currentTariff: null,
      nextTariff: null,
    };
    mockedApiService.fetchAllDashboardData.mockResolvedValue(mockDataNoTariffs);

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Current')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });
});
