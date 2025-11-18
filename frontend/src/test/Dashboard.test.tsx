import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  it('renders dashboard heading', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('Projects')).toBeDefined()
  })

  it('shows new project button', () => {
    renderWithProviders(<Dashboard />)
    expect(screen.getByText('New Project')).toBeDefined()
  })
})
