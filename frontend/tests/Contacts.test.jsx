import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Contacts from '../src/components/pages/Contacts';
describe('Contacts Component', () => {
  test('renders contacts page', () => {
    render(<Contacts />);
    // Use getByRole to be more specific - target the heading
    expect(screen.getByRole('heading', { name: /contacts/i })).toBeInTheDocument();
  });
});