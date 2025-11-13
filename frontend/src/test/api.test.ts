import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { fetchAllDashboardData } from '../services/api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the current date to be 2024-01-15 12:00:00 (a Monday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchAllDashboardData', () => {
    it('fetches data from the correct endpoint', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 15.5,
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetchAllDashboardData();

      // Should fetch MTD data (from start of month to chartEndDate which is tomorrow)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tariff-rates-with-historic-consumption'),
        expect.objectContaining({
          params: expect.objectContaining({
            start_datetime: expect.stringContaining('2024-01-01'),
            end_datetime: expect.stringContaining('2024-01-16'), // Tomorrow's date for chart data
          }),
        })
      );
    });

    it('returns all data structures', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 1.0,
          },
          {
            valid_from: '2024-01-15T00:30:00Z',
            value_inc_vat: 22.0,
            consumption: 1.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      expect(result).toHaveProperty('mtdData');
      expect(result).toHaveProperty('mtdCostSummary');
      expect(result).toHaveProperty('wtdCostSummary');
      expect(result).toHaveProperty('todayCostSummary');
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('chartCostSummary');
      expect(Array.isArray(result.chartData)).toBe(true);
    });

    it('calculates MTD cost summary correctly', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00Z',
            value_inc_vat: 20.0, // 20 p/kWh
            consumption: 2.0, // 2 kWh
          },
          {
            valid_from: '2024-01-10T00:00:00Z',
            value_inc_vat: 30.0, // 30 p/kWh
            consumption: 3.0, // 3 kWh
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // MTD Total cost: (2 * 20) + (3 * 30) = 40 + 90 = 130 pence = £1.30
      expect(result.mtdCostSummary.totalCost).toBe(1.3);

      // MTD Average cost per kWh: 130 / 5 = 26 p/kWh
      expect(result.mtdCostSummary.averageCostPerKwh).toBe(26.0);
      expect(result.mtdCostSummary.period).toBe('MTD');
    });

    it('groups chart data by date', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 15.5,
            consumption: 0.5,
          },
          {
            valid_from: '2024-01-16T00:00:00Z', // Tomorrow
            value_inc_vat: 16.5,
            consumption: 0.6,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // Should have 2 dates * 2 trace types (tariff + consumption) = 4 traces
      expect(result.chartData.length).toBe(4);
    });

    it('creates tariff and consumption traces', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 15.5,
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));
      const consumptionTrace = result.chartData.find((trace) => trace.name?.includes('consumption'));

      expect(tariffTrace).toBeDefined();
      expect(consumptionTrace).toBeDefined();
      expect((consumptionTrace as any)?.yaxis).toBe('y2');
    });

    it('formats time correctly in chart data', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 15.5,
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));
      expect((tariffTrace as any)?.x).toBeDefined();
      expect(Array.isArray((tariffTrace as any)?.x)).toBe(true);
    });

    it('handles empty data', async () => {
      const mockResponse = {
        data: [],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      expect(result.chartData).toEqual([]);
      expect(result.mtdCostSummary.totalCost).toBe(0);
      expect(result.mtdCostSummary.averageCostPerKwh).toBe(0);
      expect(result.wtdCostSummary.totalCost).toBe(0);
      expect(result.wtdCostSummary.averageCostPerKwh).toBe(0);
    });

    it('converts pence to pounds correctly', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 50.0, // 50 p/kWh
            consumption: 10.0, // 10 kWh
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // Total cost: 10 * 50 = 500 pence = £5.00
      expect(result.mtdCostSummary.totalCost).toBe(5.0);
      expect(result.wtdCostSummary.totalCost).toBe(5.0); // Same day so WTD = MTD
    });

    it('handles API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(fetchAllDashboardData()).rejects.toThrow('Network error');
    });

    it('sorts chart data by time', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T01:00:00Z',
            value_inc_vat: 16.5,
            consumption: 0.6,
          },
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 15.5,
            consumption: 0.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      const tariffTrace = result.chartData.find((trace) => trace.name?.includes('price'));

      // First entry should be the earlier time
      expect((tariffTrace as any)?.y?.[0]).toBe(15.5);
      expect((tariffTrace as any)?.y?.[1]).toBe(16.5);
    });

    it('calculates WTD separately from MTD', async () => {
      const mockResponse = {
        data: [
          // Week 1 of month (before current week)
          {
            valid_from: '2024-01-02T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 1.0,
          },
          {
            valid_from: '2024-01-03T00:00:00Z',
            value_inc_vat: 25.0,
            consumption: 1.5,
          },
          // Current week (WTD) - week starts on Monday 2024-01-15
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 30.0,
            consumption: 2.0,
          },
          {
            valid_from: '2024-01-15T06:00:00Z',
            value_inc_vat: 35.0,
            consumption: 2.5,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // Should fetch from start of month
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/tariff-rates-with-historic-consumption'),
        expect.objectContaining({
          params: expect.objectContaining({
            start_datetime: expect.stringContaining('2024-01-01'),
          }),
        })
      );

      // Should return all data structures
      expect(result).toHaveProperty('mtdData');
      expect(result).toHaveProperty('mtdCostSummary');
      expect(result).toHaveProperty('wtdCostSummary');
      expect(result).toHaveProperty('todayCostSummary');
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('chartCostSummary');
    });

    it('calculates MTD cost summary correctly', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 5.0,
          },
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 30.0,
            consumption: 3.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // MTD: (5 * 20) + (3 * 30) = 100 + 90 = 190 pence = £1.90
      expect(result.mtdCostSummary.totalCost).toBe(1.9);
      // Average: 190 / 8 = 23.75 p/kWh
      expect(result.mtdCostSummary.averageCostPerKwh).toBe(23.75);
      expect(result.mtdCostSummary.period).toBe('MTD');
    });

    it('calculates WTD cost summary correctly by filtering MTD data', async () => {
      const mockResponse = {
        data: [
          // Before current week (should not be included in WTD)
          {
            valid_from: '2024-01-08T00:00:00Z', // Previous Monday
            value_inc_vat: 15.0,
            consumption: 1.0,
          },
          // Current week (WTD) - starts 2024-01-15 (Monday)
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 2.0,
          },
          {
            valid_from: '2024-01-15T06:00:00Z',
            value_inc_vat: 25.0,
            consumption: 3.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // WTD should only include data from current week
      // (2 * 20) + (3 * 25) = 40 + 75 = 115 pence = £1.15
      expect(result.wtdCostSummary.totalCost).toBe(1.15);
      // Average: 115 / 5 = 23 p/kWh
      expect(result.wtdCostSummary.averageCostPerKwh).toBe(23.0);
      expect(result.wtdCostSummary.period).toBe('WTD');
    });

    it('calculates Today cost summary correctly by filtering MTD data', async () => {
      const mockResponse = {
        data: [
          // Previous day (should not be included in Today)
          {
            valid_from: '2024-01-14T23:00:00Z', // Yesterday
            value_inc_vat: 15.0,
            consumption: 1.0,
          },
          // Today's data - current date is 2024-01-15
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 2.0,
          },
          {
            valid_from: '2024-01-15T06:00:00Z',
            value_inc_vat: 25.0,
            consumption: 3.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // Today should only include data from current day (2024-01-15)
      // (2 * 20) + (3 * 25) = 40 + 75 = 115 pence = £1.15
      expect(result.todayCostSummary.totalCost).toBe(1.15);
      // Average: 115 / 5 = 23 p/kWh
      expect(result.todayCostSummary.averageCostPerKwh).toBe(23.0);
      expect(result.todayCostSummary.period).toBe('Today');
    });

    it('filters chart data for specified date range', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 1.0,
          },
          {
            valid_from: '2024-01-10T00:00:00Z',
            value_inc_vat: 25.0,
            consumption: 1.5,
          },
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 30.0,
            consumption: 2.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      // Chart data should be filtered for today and tomorrow
      expect(result.chartData).toBeDefined();
      expect(Array.isArray(result.chartData)).toBe(true);

      // Chart cost summary should only include data from today
      expect(result.chartCostSummary.totalCost).toBe(0.6); // 2.0 * 30 = 60 pence
      expect(result.chartCostSummary.averageCostPerKwh).toBe(30.0);
    });

    it('makes only one API call', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 1.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetchAllDashboardData();

      // Should only call the API once (for MTD data)
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('handles empty MTD data', async () => {
      const mockResponse = {
        data: [],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      expect(result.mtdCostSummary.totalCost).toBe(0);
      expect(result.mtdCostSummary.averageCostPerKwh).toBe(0);
      expect(result.wtdCostSummary.totalCost).toBe(0);
      expect(result.wtdCostSummary.averageCostPerKwh).toBe(0);
      expect(result.chartData).toEqual([]);
    });

    it('handles division by zero when calculating average cost per kWh', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 0, // Zero consumption
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      expect(result.mtdCostSummary.averageCostPerKwh).toBe(0);
    });

    it('returns all MTD data in mtdData property', async () => {
      const mockResponse = {
        data: [
          {
            valid_from: '2024-01-01T00:00:00Z',
            value_inc_vat: 20.0,
            consumption: 1.0,
          },
          {
            valid_from: '2024-01-15T00:00:00Z',
            value_inc_vat: 30.0,
            consumption: 2.0,
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllDashboardData();

      expect(result.mtdData).toEqual(mockResponse.data);
      expect(result.mtdData.length).toBe(2);
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(fetchAllDashboardData()).rejects.toThrow('Network error');
    });
  });
});
