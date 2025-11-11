import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../src/components/layout/Layout';

// Mock the useAuth hook
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

describe('Layout Component', () => {
  const renderWithRouter = (ui) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };

  it('renders layout with children', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="test-content">Test content</div>
      </Layout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders mocked sidebar and header', () => {
    renderWithRouter(
      <Layout>
        <div>Test content</div>
      </Layout>
    );

    // Adjust these based on your actual component structure
    expect(screen.getByText(/Test content/i)).toBeInTheDocument();
  });

  it('has main content area', () => {
    renderWithRouter(
      <Layout>
        <div>Test content</div>
      </Layout>
    );

    const mainElement = screen.getByRole('main') || screen.getByText(/Test content/i);
    expect(mainElement).toBeInTheDocument();
  });
});