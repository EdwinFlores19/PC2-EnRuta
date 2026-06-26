import { test, expect } from '@playwright/test';

/**
 * Suite 1: Validación Legal y Onboarding KYC
 * Establishes data-testid contracts for the frontend onboarding flow.
 */
test.describe('Onboarding KYC & Legal Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the onboarding route (TDD Contract Route)
    await page.goto('/onboarding');
  });

  /**
   * Caso A: Bloqueo de menores de 14 años
   * - Must input a birthdate resulting in < 14 years old.
   * - The submit button 'btn-submit-kyc' must be disabled.
   * - The error banner 'error-age-restriction' must be visible in the DOM.
   */
  test('Caso A: Bloqueo estricto para menores de 14 años', async ({ page }) => {
    // 1. Calculate a birthdate that makes the user 13 years old
    const today = new Date();
    const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const birthdateString = thirteenYearsAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // 2. Fill the birthdate input using data-testid
    const birthdateInput = page.locator('[data-testid="input-birthdate"]');
    await expect(birthdateInput).toBeVisible();
    await birthdateInput.fill(birthdateString);
    await birthdateInput.dispatchEvent('change');

    // 3. Assert that the submit button is disabled
    const submitBtn = page.locator('[data-testid="btn-submit-kyc"]');
    await expect(submitBtn).toBeDisabled();

    // 4. Assert that the age restriction error is displayed
    const errorBanner = page.locator('[data-testid="error-age-restriction"]');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/menor/i); // Assert text contents to guide UI design
  });

  /**
   * Caso B: Permiso MINTRA para adolescentes de 14 a 17 años
   * - Must input a birthdate resulting in 16 years old.
   * - The system must display the upload area 'upload-mintra-pdf'.
   * - Mock the successful response of the API when submitting.
   */
  test('Caso B: Habilitar flujo con permiso MINTRA para adolescentes (14-17 años)', async ({ page }) => {
    // 1. Calculate a birthdate that makes the user 16 years old
    const today = new Date();
    const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const birthdateString = sixteenYearsAgo.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // 2. Mock API route for KYC submission
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

    // 3. Fill the birthdate input using data-testid
    const birthdateInput = page.locator('[data-testid="input-birthdate"]');
    await expect(birthdateInput).toBeVisible();
    await birthdateInput.fill(birthdateString);
    await birthdateInput.dispatchEvent('change');

    // 4. Verify that the MINTRA document upload area appears
    const mintraUpload = page.locator('[data-testid="upload-mintra-pdf"]');
    await expect(mintraUpload).toBeVisible();

    // 5. Fill out mandatory identification fields
    await page.locator('[data-testid="select-document-type"]').selectOption('DNI');
    await page.locator('[data-testid="input-document-number"]').fill('76543210');

    // 6. Simulate file selection for the MINTRA PDF permission
    await mintraUpload.setInputFiles({
      name: 'permiso_mintra.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 dummy pdf content'),
    });

    // 7. Verify the submit button is now enabled and click it
    const submitBtn = page.locator('[data-testid="btn-submit-kyc"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 8. Verify success state is rendered
    const successAlert = page.locator('[data-testid="kyc-success-alert"]');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(/pendiente/i);
  });

});
