import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/hooks/useAuth';
import Header from '../src/components/layout/Header';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  test('renders header with welcome message', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  test('renders sign out button', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});