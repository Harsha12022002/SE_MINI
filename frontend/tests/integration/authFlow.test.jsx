import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../src/components/pages/Login'
// eslint-disable-next-line no-unused-vars
import { useAuth, AuthProvider } from '../../src/hooks/useAuth'


// Mock API calls
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(() => Promise.resolve({ 
      data: { 
        user: { id: 1, email: 'test@example.com', role: 'user' }, 
        token: 'mock-token' 
      } 
    }))
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Auth Flow Integration', () => {
  test('login form validation', () => {
    renderWithProviders(<Login />);
    
    // Test form elements exist
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    
    // Test form validation
    fireEvent.click(submitButton);
    
    // Should show validation errors
    expect(emailInput).toBeInvalid();
    expect(passwordInput).toBeInvalid();
  });
});