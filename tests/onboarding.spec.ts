import { test, expect } from '@playwright/test';

test.describe('Onboarding KYC & Legal Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('Caso A: Bloqueo estricto para menores de 14 años', async ({ page }) => {
    const today = new Date();
    const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const birthdateString = thirteenYearsAgo.toISOString().split('T')[0];

    const birthdateInput = page.locator('[data-testid="input-birthdate"]');
    await expect(birthdateInput).toBeVisible();
    await birthdateInput.fill(birthdateString);
    await birthdateInput.dispatchEvent('change');

    const submitBtn = page.locator('[data-testid="btn-submit-kyc"]');
    await expect(submitBtn).toBeDisabled();

    const errorBanner = page.locator('[data-testid="error-age-restriction"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/menor/i);
  });

  test('Caso B: Habilitar flujo con permiso MINTRA para adolescentes (14-17 años)', async ({ page }) => {
    const today = new Date();
    const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const birthdateString = sixteenYearsAgo.toISOString().split('T')[0];

    await page.route('**/api/v1/formalization/kyc', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'KYC registrado para evaluación manual de MINTRA',
          data: {
            id: 'mock-kyc-id-12345',
            age: 16,
            status: 'PENDING_APPROVAL',
            mintraAuthUrl: 'https://supabase.co/storage/mintra_16.pdf'
          }
        }),
      });
    });

    const birthdateInput = page.locator('[data-testid="input-birthdate"]');
    await expect(birthdateInput).toBeVisible();
    await birthdateInput.fill(birthdateString);
    await birthdateInput.dispatchEvent('change');

    const mintraUpload = page.locator('[data-testid="upload-mintra-pdf"]');
    await expect(mintraUpload).toBeVisible();

    await page.locator('[data-testid="select-document-type"]').selectOption('DNI');
    await page.locator('[data-testid="input-document-number"]').fill('76543210');

    await mintraUpload.setInputFiles({
      name: 'permiso_mintra.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 dummy pdf content'),
    });

    const submitBtn = page.locator('[data-testid="btn-submit-kyc"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    const successAlert = page.locator('[data-testid="kyc-success-alert"]');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/pendiente/i);
  });

});
