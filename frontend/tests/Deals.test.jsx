import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Deals from '../src/components/pages/Deals';
const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (component) => {
  const queryClient = createTestQueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Deals Component', () => {
  test('renders deals page heading', () => {
    renderWithProviders(<Deals />);
    // Use the main heading (h1) specifically
    expect(screen.getByRole('heading', { level: 1, name: /deals pipeline/i })).toBeInTheDocument();
  });

  test('renders deals description', () => {
    renderWithProviders(<Deals />);
    expect(screen.getByText(/manage your sales deals and track progress/i)).toBeInTheDocument();
  });
});