import { test, expect } from '@playwright/test';

test('login → self-report → exchange → redeem', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started' }).click();
  await expect(page).toHaveURL(/signin/);

  await page.getByLabel('Email').fill('demo@mission.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL(/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

  await page.getByRole('link', { name: 'Self-report' }).click();
  await expect(page).toHaveURL(/self-report/);
  await page.getByLabel('Mood').fill('Focused');
  await page.getByLabel('Energy (1-10)').fill('7');
  await page.getByLabel('Mission notes').fill('Ready to trade insights.');
  await page.getByRole('button', { name: 'Submit self-report' }).click();

  await page.getByRole('link', { name: 'Exchange' }).click();
  await expect(page).toHaveURL(/exchange/);
  await expect(page.getByRole('heading', { name: 'Exchange Center' })).toBeVisible();

  await page.getByRole('link', { name: 'Redeem' }).click();
  await expect(page).toHaveURL(/redeem/);
  await expect(page.getByRole('heading', { name: 'Redeem Rewards' })).toBeVisible();
});
