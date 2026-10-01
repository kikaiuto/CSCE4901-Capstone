import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getTheme, syncFromDocument } from '@/core/lib/theme'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    syncFromDocument()
  })

  it('starts dark, with no theme attribute on the document', () => {
    render(<ThemeToggle />)

    expect(getTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })

  it('switches the document to light and remembers it', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('s7-theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('switches back to dark and clears the attribute', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }))

    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('s7-theme')).toBe('dark')
  })

  it('restores a stored light preference', () => {
    localStorage.setItem('s7-theme', 'light')
    syncFromDocument()

    render(<ThemeToggle />)

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(getTheme()).toBe('light')
  })
})
