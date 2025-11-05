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
  const mockDashboardData = {
    chartData: [
      {
        x: ['00:00', '00:30'],
        y: [15.5, 16.2],
        type: 'scattergl',
        mode: 'lines+markers',
        name: '2024-01-01 price',
      },
    ],
    costSummary: {
      totalCost: 1.25,
      totalConsumption: 10.5,
      averagePrice: 15.8,
      itemCount: 48,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock fetchDashboardData to delay response
    mockedApiService.fetchDashboardData.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard title after loading', async () => {
    // Mock successful API response
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Octopus Energy Dashboard')).toBeInTheDocument();
    });
  });

  it('renders plot component after data loads', async () => {
    // Mock successful API response
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plot-component')).toBeInTheDocument();
    });
  });

  it('renders cost summary cards after data loads', async () => {
    // Mock successful API response
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Total Cost Today')).toBeInTheDocument();
      expect(screen.getByText('Total Consumption')).toBeInTheDocument();
      expect(screen.getByText('Avg Cost per kWh')).toBeInTheDocument();
    });
  });

  it('displays cost summary values correctly', async () => {
    // Mock successful API response
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('£1.25')).toBeInTheDocument();
      expect(screen.getByText(/10\.50/)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock fetchDashboardData to reject
    mockedApiService.fetchDashboardData.mockRejectedValue(new Error('API Error'));

    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      // Should not show loading after error
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('calls fetchDashboardData with correct date range', async () => {
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      expect(mockedApiService.fetchDashboardData).toHaveBeenCalledWith(
        '2025-11-03T00:00:00',
        '2025-11-05T23:59:59'
      );
    });
  });

  it('calculates average cost per kWh correctly', async () => {
    mockedApiService.fetchDashboardData.mockResolvedValue(mockDashboardData);

    render(<App />);

    await waitFor(() => {
      // totalCost (£1.25) / totalConsumption (10.5 kWh) = 0.119 p/kWh = 0.12 p/kWh
      expect(screen.getByText(/0\.12/)).toBeInTheDocument();
    });
  });
});
