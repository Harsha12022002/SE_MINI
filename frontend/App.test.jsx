import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import App from './src/App';
describe('App Component - CRM Login', () => {
  test('renders CRM login interface', () => {
    render(<App />);
    
    // Verify this is a CRM application
    expect(screen.getByText(/CRM Dashboard/i)).toBeInTheDocument();
    
    // Verify login form structure - use tag name instead of role
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
  });

  test('shows admin demo credentials', () => {
    render(<App />);
    
    // Verify admin access is mentioned (important for CRM)
    expect(screen.getByText(/admin@crm.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin:/i)).toBeInTheDocument();
  });

  test('provides user demo credentials', () => {
    render(<App />);
    
    // Verify regular user access is mentioned
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/User:/i)).toBeInTheDocument();
  });

  test('has accessible authentication form', () => {
    render(<App />);
    
    // Test form accessibility and proper HTML structure
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(emailInput).toHaveAttribute('id', 'email');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });
});