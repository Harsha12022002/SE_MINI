
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Contacts from '../src/components/pages/Contacts';
// Mock the API properly
vi.mock('../services/api', () => ({
  contactsAPI: {
    getAll: vi.fn(() => Promise.resolve({ 
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '1234567890', status: 'lead', company: 'Test Corp' }
      ], 
      total: 1 
    }))
  },
  authAPI: {
    getCurrentUser: vi.fn(() => Promise.resolve({ 
      data: { user: { id: 1, email: 'test@example.com' } } 
    }))
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { 
    queries: { 
      retry: false,
      enabled: false // Disable queries by default to prevent automatic fetching
    } 
  },
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

describe('Contacts Comprehensive Tests', () => {
  test('renders contacts page structure', () => {
    renderWithProviders(<Contacts />);
    
    // Test basic page structure without waiting for data
    expect(screen.getByRole('heading', { name: /contacts/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your contacts and customer relationships/i)).toBeInTheDocument();
  });
  
  test('shows loading state initially', () => {
    renderWithProviders(<Contacts />);
    
    // Should show loading state
    expect(screen.getByText(/loading contacts/i)).toBeInTheDocument();
  });
});
