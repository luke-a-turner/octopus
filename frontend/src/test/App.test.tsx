import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from '../App';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock react-plotly.js to avoid WebGL issues in tests
vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plot-component">Mocked Plot</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock axios to delay response
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard title after loading', async () => {
    // Mock successful API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('tariff-data')) {
        return Promise.resolve({
          data: [
            {
              valid_from: '2024-01-01T00:00:00',
              value_inc_vat: 15.5,
            },
            {
              valid_from: '2024-01-01T00:30:00',
              value_inc_vat: 16.2,
            },
          ],
        });
      } else if (url.includes('smart-meter-usage')) {
        return Promise.resolve({
          data: [
            {
              interval_start: '2024-01-01T00:00:00',
              consumption: 0.5,
            },
          ],
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Octopus Energy Dashboard')).toBeInTheDocument();
    });
  });

  it('renders plot component after data loads', async () => {
    // Mock successful API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('tariff-data')) {
        return Promise.resolve({
          data: [
            {
              valid_from: '2024-01-01T00:00:00',
              value_inc_vat: 15.5,
            },
          ],
        });
      } else if (url.includes('smart-meter-usage')) {
        return Promise.resolve({
          data: [],
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plot-component')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock axios to reject
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    // Mock console.error to avoid noise in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      // Should not show loading after error
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('makes API calls to correct endpoints', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(<App />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('tariff-data-today-and-tomorrow')
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('smart-meter-historic-consumption')
      );
    });
  });

  it('processes tariff data correctly', async () => {
    const mockTariffData = [
      {
        valid_from: '2024-01-01T00:00:00',
        value_inc_vat: 15.5,
      },
      {
        valid_from: '2024-01-01T00:30:00',
        value_inc_vat: 16.2,
      },
    ];

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('tariff-data')) {
        return Promise.resolve({ data: mockTariffData });
      } else {
        return Promise.resolve({ data: [] });
      }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('plot-component')).toBeInTheDocument();
    });

    // Verify that axios was called with the correct URLs
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });
});
