import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import Team from '../src/components/pages/Team';
// Create isolated QueryClient for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

// Helper to render any component with providers
const renderWithProviders = (ui) => {
  const queryClient = createTestQueryClient();
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Team Component', () => {
  test('renders Team page heading', async () => {
    renderWithProviders(<Team />);
    const heading = await screen.findByRole('heading', { level: 1, name: /team/i });
    expect(heading).toBeInTheDocument();
  });

  test('renders team description text', async () => {
    renderWithProviders(<Team />);
    const description = await screen.findByText(/manage your team/i);
    expect(description).toBeInTheDocument();
  });

  // ✅ Modified this test to check actual tab buttons instead of "Add"
  test('renders tab navigation buttons correctly', async () => {
    renderWithProviders(<Team />);
    const tabButtons = await screen.findAllByRole('button');
    expect(tabButtons.length).toBeGreaterThan(0);
    expect(tabButtons[0]).toHaveTextContent(/team/i);
  });
});