
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import StatCard from '../src/components/common/StatCard';
describe('StatCard Component', () => {
  test('renders stat card with title and value', () => {
    render(<StatCard title="Total Contacts" value="150" />);
    expect(screen.getByText(/total contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/150/i)).toBeInTheDocument();
  });
});
