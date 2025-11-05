import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchDashboardData } from '../services/api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchDashboardData', () => {
    it('fetches data from the correct endpoint', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 15.5,
            interval_start: '2024-01-01T00:00:00',
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8000/tariff-rates-with-historic-consumption',
        {
          params: {
            start_datetime: '2024-01-01T00:00:00',
            end_datetime: '2024-01-01T23:59:59',
          },
        }
      );
    });

    it('returns chart data and cost summary', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 20.0,
            interval_start: '2024-01-01T00:00:00',
            consumption: 1.0,
          },
          {
            valid_from: '2024-01-01T00:30:00',
            value_inc_vat: 22.0,
            interval_start: '2024-01-01T00:30:00',
            consumption: 1.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('costSummary');
      expect(Array.isArray(result.chartData)).toBe(true);
    });

    it('calculates cost summary correctly', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 20.0, // 20 p/kWh
            interval_start: '2024-01-01T00:00:00',
            consumption: 2.0, // 2 kWh
          },
          {
            valid_from: '2024-01-01T00:30:00',
            value_inc_vat: 30.0, // 30 p/kWh
            interval_start: '2024-01-01T00:30:00',
            consumption: 3.0, // 3 kWh
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      // Total cost: (2 * 20) + (3 * 30) = 40 + 90 = 130 pence = £1.30
      expect(result.costSummary.totalCost).toBe(1.3);

      // Total consumption: 2 + 3 = 5 kWh
      expect(result.costSummary.totalConsumption).toBe(5.0);

      // Average price: (20 + 30) / 2 = 25 p/kWh
      expect(result.costSummary.averagePrice).toBe(25.0);

      // Item count: 2
      expect(result.costSummary.itemCount).toBe(2);
    });

    it('groups data by date', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 15.5,
            interval_start: '2024-01-01T00:00:00',
            consumption: 0.5,
          },
          {
            valid_from: '2024-01-02T00:00:00',
            value_inc_vat: 16.5,
            interval_start: '2024-01-02T00:00:00',
            consumption: 0.6,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-02T23:59:59');

      // Should have 2 dates * 2 trace types (tariff + consumption) = 4 traces
      expect(result.chartData.length).toBe(4);
    });

    it('creates tariff and consumption traces', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 15.5,
            interval_start: '2024-01-01T00:00:00',
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));
      const consumptionTrace = result.chartData.find((trace) => trace.name?.includes('consumption'));

      expect(tariffTrace).toBeDefined();
      expect(consumptionTrace).toBeDefined();
      expect(consumptionTrace?.yaxis).toBe('y2');
    });

    it('formats time correctly in chart data', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 15.5,
            interval_start: '2024-01-01T00:00:00',
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));
      expect(tariffTrace?.x).toBeDefined();
      expect(Array.isArray(tariffTrace?.x)).toBe(true);
    });

    it('handles empty data', async () => {
      const mockResponse = {
        data: [],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      expect(result.chartData).toEqual([]);
      expect(result.costSummary.totalCost).toBe(0);
      expect(result.costSummary.totalConsumption).toBe(0);
      expect(result.costSummary.averagePrice).toBe(0);
      expect(result.costSummary.itemCount).toBe(0);
    });

    it('converts pence to pounds correctly', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 50.0, // 50 p/kWh
            interval_start: '2024-01-01T00:00:00',
            consumption: 10.0, // 10 kWh
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      // Total cost: 10 * 50 = 500 pence = £5.00
      expect(result.costSummary.totalCost).toBe(5.0);
    });

    it('handles API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59')
      ).rejects.toThrow('Network error');
    });

    it('sorts chart data by time', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T01:00:00',
            value_inc_vat: 16.5,
            interval_start: '2024-01-01T01:00:00',
            consumption: 0.6,
          },
          {
            valid_from: '2024-01-01T00:00:00',
            value_inc_vat: 15.5,
            interval_start: '2024-01-01T00:00:00',
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDashboardData('2024-01-01T00:00:00', '2024-01-01T23:59:59');

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));

      // First entry should be the earlier time
      expect(tariffTrace?.y?.[0]).toBe(15.5);
      expect(tariffTrace?.y?.[1]).toBe(16.5);
    });
  });
});
