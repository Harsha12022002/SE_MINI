
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/hooks/useAuth';
import Login from '../src/components/pages/Login';
// Wrap with all required providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  test('renders login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
  });

  test('shows demo credentials', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Demo Credentials:/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@crm.com/i)).toBeInTheDocument();
  });
});
