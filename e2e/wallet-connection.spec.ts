import { test, expect } from '@playwright/test'

test.describe('Wallet Connection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('displays wallet connection options', async ({ page }) => {
    // Check for the internationalized title
    await expect(page.getByText('Web3 Wallet')).toBeVisible()
    await expect(page.getByText('Create New Wallet')).toBeVisible()
    await expect(page.getByText('Load from .env File')).toBeVisible()
    await expect(page.getByText('Connect MetaMask')).toBeVisible()
    await expect(page.getByText('WalletConnect')).toBeVisible()
    await expect(page.getByText('Recover Wallet')).toBeVisible()
    
    // Take screenshot of the main wallet connection page
    await expect(page).toHaveScreenshot('wallet-connection-main.png')
  })

  test('opens create wallet dialog', async ({ page }) => {
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    await expect(page.getByText('Create New Wallet')).toBeVisible()
    await expect(page.getByText('Set Password')).toBeVisible()
    
    // Take screenshot of create wallet dialog
    await expect(page).toHaveScreenshot('create-wallet-dialog.png')
  })

  test('shows password validation', async ({ page }) => {
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Fill in weak password
    await page.getByLabel('Password').fill('weak')
    await page.getByLabel('Confirm Password').fill('weak')
    
    // Click create and expect validation
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Should show error for weak password
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
  })

  test('completes wallet creation flow with strong password', async ({ page }) => {
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Fill in strong password
    const strongPassword = 'StrongPassword123!'
    await page.getByLabel('Password').fill(strongPassword)
    await page.getByLabel('Confirm Password').fill(strongPassword)
    
    // Click create
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Should proceed to mnemonic step
    await expect(page.getByText('Backup Seed')).toBeVisible()
  })

  test('opens MetaMask connection dialog', async ({ page }) => {
    await page.getByRole('button', { name: /connect metamask/i }).click()
    
    await expect(page.getByText('Connect MetaMask')).toBeVisible()
    await expect(page.getByText(/Connect your existing MetaMask wallet/i)).toBeVisible()
  })

  test('opens WalletConnect dialog', async ({ page }) => {
    await page.getByRole('button', { name: /connect mobile wallet/i }).click()
    
    await expect(page.getByText('Connect WalletConnect')).toBeVisible()
    await expect(page.getByText(/Connect your mobile wallet using WalletConnect/i)).toBeVisible()
  })

  test('opens wallet recovery dialog', async ({ page }) => {
    await page.getByRole('button', { name: /recover wallet/i }).click()
    
    await expect(page.getByText('Recover Wallet')).toBeVisible()
    await expect(page.getByText(/Enter your 12 or 24 word mnemonic phrase/i)).toBeVisible()
  })

  test('validates mnemonic phrase in recovery', async ({ page }) => {
    await page.getByRole('button', { name: /recover wallet/i }).click()
    
    // Try with invalid mnemonic
    await page.getByPlaceholder('Enter your 12 or 24 word mnemonic phrase').fill('invalid mnemonic words')
    
    // Should show validation error
    await expect(page.getByText(/invalid mnemonic phrase/i)).toBeVisible()
  })

  test('can close dialogs', async ({ page }) => {
    await page.getByRole('button', { name: /create wallet/i }).click()
    await expect(page.getByText('Create New Wallet')).toBeVisible()
    
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByText('Create New Wallet')).not.toBeVisible()
  })

  test('language selector works', async ({ page }) => {
    // Check if language selector exists
    const languageButton = page.getByRole('button', { name: /language/i })
    
    if (await languageButton.isVisible()) {
      await languageButton.click()
      
      // Check for language options
      await expect(page.getByText('English')).toBeVisible()
      await expect(page.getByText('日本語')).toBeVisible()
      
      // Switch to Japanese
      await page.getByText('日本語').click()
      
      // Check if text changed to Japanese
      await expect(page.getByText('新しいウォレットを作成')).toBeVisible()
    }
  })

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.getByText('Web3 Wallet')).toBeVisible()
    await expect(page.getByText('Create New Wallet')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await expect(page.getByText('Web3 Wallet')).toBeVisible()
    await expect(page.getByText('Create New Wallet')).toBeVisible()
  })

  test('error handling displays correctly', async ({ page }) => {
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Fill in mismatched passwords
    await page.getByLabel('Password').fill('StrongPassword123!')
    await page.getByLabel('Confirm Password').fill('DifferentPassword123!')
    
    await page.getByRole('button', { name: /create wallet/i }).click()
    
    // Should show error for mismatched passwords
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })
})