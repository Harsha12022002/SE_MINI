
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import ContactStats from '../src/components/contacts/ContactStats';
describe('ContactStats Component', () => {
  test('renders contact stats cards', () => {
    render(<ContactStats stats={{ total: 0, active: 0, inactive: 0 }} />);
    expect(screen.getByText(/total contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/leads/i)).toBeInTheDocument();
    expect(screen.getByText(/prospects/i)).toBeInTheDocument();
    expect(screen.getByText(/customers/i)).toBeInTheDocument();
  });
});
