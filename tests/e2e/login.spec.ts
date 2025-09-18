import { test, expect } from '@playwright/test'

// Use baseURL from environment if provided, otherwise default to localhost
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('End‑to‑End flows', () => {
  test('user can sign in and create a new item', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${baseURL}/login`)
    // Fill in email and name
    await page.fill('label:has-text("Email") >> input', 'owner@example.com')
    await page.fill('label:has-text("Name (optional)") >> input', 'Owner')
    // Submit the form and wait for redirect
    await Promise.all([
      page.waitForNavigation(),
      page.click('button:has-text("Sign In")'),
    ])
    // Verify that the home page navigation is visible
    await expect(page.locator('h1', { hasText: 'Genesys RPG Manager' })).toBeVisible()
    // Navigate to Items page
    await page.click('a[href="/items"]')
    await expect(page.locator('h1', { hasText: 'Items' })).toBeVisible()
    // Click Add Item (available to owners)
    await page.click('a[href="/items/new"]')
    // Fill new item form
    await expect(page.locator('h1', { hasText: 'New Item' })).toBeVisible()
    await page.fill('label:has-text("Name") >> input', 'Test Item')
    await page.selectOption('label:has-text("Type") >> select', 'GEAR')
    await page.fill('label:has-text("Rarity") >> input', '1')
    await page.fill('label:has-text("Encumbrance") >> input', '0')
    await page.fill('label:has-text("Price") >> input', '100')
    await page.fill('label:has-text("Description") >> textarea', 'E2E test item description')
    // Submit the form and wait for redirect back to items page
    await Promise.all([
      page.waitForNavigation(),
      page.click('button:has-text("Create")'),
    ])
    // Verify that the new item appears in list
    await expect(page.locator('table tr', { hasText: 'Test Item' })).toBeVisible()
  })
})