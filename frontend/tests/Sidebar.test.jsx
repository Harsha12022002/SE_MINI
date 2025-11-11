
// src/tests/Sidebar.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../src/components/layout/Sidebar';
// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { name: 'Test User' },
    logout: vi.fn()
  })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  test('renders sidebar with navigation items', () => {
    renderWithRouter(<Sidebar />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('CRM System')).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    renderWithRouter(<Sidebar />);
    
    // Test what's actually visible in the DOM
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  test('navigation links have correct hrefs', () => {
    renderWithRouter(<Sidebar />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');
    
    const contactsLink = screen.getByText('Contacts').closest('a');
    expect(contactsLink).toHaveAttribute('href', '/contacts');
  });

  test('sidebar has correct structure', () => {
    renderWithRouter(<Sidebar />);
    
    const sidebar = document.querySelector('.w-64');
    expect(sidebar).toBeInTheDocument();
    
    const navElement = screen.getByRole('navigation');
    expect(navElement).toBeInTheDocument();
  });
});
