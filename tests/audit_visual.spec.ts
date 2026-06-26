import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Audit Visual EnRuta Map', () => {
  // Ensure screenshots directory exists
  test.beforeAll(() => {
    const dir = path.join(process.cwd(), './docs/screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test('Audit Map View - Desktop', async ({ page }) => {
    // Set viewport to desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Navigate to local map page
    await page.goto('http://localhost:5173/buscar');
    
    // Wait for rendering
    await page.waitForTimeout(2000);
    
    // Capture screenshot
    await page.screenshot({ path: './docs/screenshots/audit_desktop.png', fullPage: true });
    console.log('✅ Screenshot desktop guardado.');
  });

  test('Audit Map View - Mobile', async ({ page }) => {
    // Set viewport to mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to local map page
    await page.goto('http://localhost:5173/buscar');
    
    // Wait for rendering
    await page.waitForTimeout(2000);
    
    // Capture screenshot
    await page.screenshot({ path: './docs/screenshots/audit_mobile.png', fullPage: true });
    console.log('✅ Screenshot mobile guardado.');
  });
});
