import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import ContactForm from '../../src/components/contacts/ContactForm'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Contacts CRUD System', () => {
  test('contact form renders correctly', () => {
    renderWithProviders(<ContactForm />)

    // Test form structure
    expect(screen.getByPlaceholderText(/enter full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter company name/i)).toBeInTheDocument()

    // Test buttons
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create contact/i })).toBeInTheDocument()
  })
})
