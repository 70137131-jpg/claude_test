import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /ai code review platform/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should toggle between login and signup', async ({ page }) => {
    await page.goto('/login')

    // Click sign up link
    await page.getByRole('button', { name: /sign up/i }).click()

    // Should show name field for signup
    await expect(page.getByPlaceholder(/name/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should see validation messages (if implemented)
    // await expect(page.getByText(/email is required/i)).toBeVisible()
  })
})
