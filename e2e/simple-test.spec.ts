import { test, expect } from '@playwright/test'

test('capture wallet connection page', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle')
  
  // Take a screenshot of the main page
  await expect(page).toHaveScreenshot('wallet-connection-main.png')
})