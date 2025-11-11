import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ContactForm from '../src/components/contacts/ContactForm';
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ContactForm Component', () => {
  test('renders contact form inputs', () => {
    renderWithProviders(<ContactForm />);
    // Use getByPlaceholderText instead of getByLabelText
    expect(screen.getByPlaceholderText(/enter full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument();
  });

  test('renders submit button', () => {
    renderWithProviders(<ContactForm />);
    expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument();
  });
});