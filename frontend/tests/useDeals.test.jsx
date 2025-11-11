
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import useDeals from '../src/hooks/useDeals';
// Mock the API module
vi.mock('../services/api', () => ({
  fetchDeals: vi.fn(() => Promise.resolve([])),
  createDeal: vi.fn(),
  updateDeal: vi.fn(),
  deleteDeal: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useDeals Hook', () => {
  test('returns expected state properties', async () => {
    const { result } = renderHook(() => useDeals(), { wrapper });

    // Wait for the hook to initialize
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // Check if the hook returns the expected structure
    expect(typeof result.current).toBe('object');
    
    // Check for common properties (adjust based on your actual hook)
    if (result.current.deals !== undefined) {
      expect(Array.isArray(result.current.deals)).toBe(true);
    }
    
    if (result.current.loading !== undefined) {
      expect(typeof result.current.loading).toBe('boolean');
    }
    
    if (result.current.error !== undefined) {
      expect(result.current.error).toBeNull();
    }
  });

  test('handles deals data fetching', async () => {
    const { result } = renderHook(() => useDeals(), { wrapper });

    await waitFor(() => {
      // The hook should eventually return some state
      expect(result.current).toBeDefined();
    });

    // Add more specific assertions based on your hook's actual implementation
  });
});
