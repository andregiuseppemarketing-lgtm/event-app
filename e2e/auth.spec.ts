import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.getByRole('heading', { name: 'Accedi' })).toBeVisible();
    await expect(page.getByPlaceholder('mario@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Accedi' }).click();
    
    // HTML5 validation should prevent submission
    await expect(page.getByPlaceholder('mario@example.com')).toBeFocused();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.getByRole('link', { name: 'Registrati qui' }).click();
    await expect(page).toHaveURL('/auth/register');
  });
});

test.describe('Home Page', () => {
  test('should display featured events', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { name: /I Migliori Eventi/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Eventi in Evidenza' })).toBeVisible();
    
    // Should show event cards
    await expect(page.getByText('Notte Bianca Catania')).toBeVisible();
    await expect(page.getByText('Summer Beach Party')).toBeVisible();
  });

  test('should navigate to login from header', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Accedi' }).click();
    await expect(page).toHaveURL('/auth/login');
  });
});