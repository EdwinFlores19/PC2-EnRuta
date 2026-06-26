import { test, expect } from '@playwright/test';

/**
 * Suite 3: Pasarela Fintech y Bloqueo Educativo
 * Establishes testing contracts for financial course gating and Yape/Plin payments.
 */
test.describe('Fintech Wallet & Educational Feature Gating', () => {

  const mockWalletId = 'uuid-wallet-98765';
  const mockTxId = 'uuid-tx-11111';
  const mockProviderTxId = 'yape-prov-tx-88888';

  /**
   * Caso A: Bloqueo Educativo (Feature Gating)
   * - Mock user profile with hasCompletedFinancialCourse: false.
   * - Navigate or click data-testid="tab-wallet".
   * - Verify that the locker modal 'locked-wallet-modal' is rendered.
   */
  test('Caso A: Bloqueo de billetera por falta de curso de educación financiera', async ({ page }) => {
    // 1. Mock formalization profile API indicating course is not completed
    await page.route('**/api/v1/formalization/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            score: 45,
            semaphoreColor: 'RED',
            hasCompletedFinancialCourse: false // Gating trigger
          }
        })
      });
    });

    // 2. Navigate to payments page
    await page.goto('/payments');

    // 3. Try to access the wallet tab
    const walletTab = page.locator('[data-testid="tab-wallet"]');
    await expect(walletTab).toBeVisible();
    await walletTab.click();

    // 4. Verify that the locked wallet modal is displayed
    const lockedModal = page.locator('[data-testid="locked-wallet-modal"]');
    await expect(lockedModal).toBeVisible();
    await expect(lockedModal).toContainText(/capacitación|curso|bloqueado/i);
  });

  /**
   * Caso B: Pago Yape Exitoso
   * - Mock profile with hasCompletedFinancialCourse: true.
   * - Generate QR with data-testid="btn-generate-yape-qr".
   * - Simulate Webhook call to confirm payment.
   * - Validate wallet balance 'wallet-balance' updates dynamically.
   */
  test('Caso B: Cobro exitoso por Yape QR con actualización dinámica de saldo', async ({ page }) => {
    let currentBalance = '100.00';

    // 1. Mock profile indicating course IS completed
    await page.route('**/api/v1/formalization/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            score: 85,
            semaphoreColor: 'GREEN',
            hasCompletedFinancialCourse: true
          }
        })
      });
    });

    // 2. Mock dynamic wallet balance response
    await page.route('**/api/v1/payments/wallet/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: mockWalletId,
            balance: currentBalance, // Will change from 100.00 to 115.00
            currency: 'PEN',
            type: 'MERCHANT',
            transactions: []
          }
        })
      });
    });

    // 3. Mock QR generation endpoint
    await page.route('**/api/v1/payments/yape-plin/qr', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: mockTxId,
            providerTransactionId: mockProviderTxId,
            qrCodeUrl: 'https://example.com/yape-qr-mock.png',
            amount: 15.00,
            paymentMethod: 'YAPE'
          }
        })
      });
    });

    // 4. Navigate to payments page
    await page.goto('/payments');

    // 5. Open the wallet tab (which should be unlocked)
    const walletTab = page.locator('[data-testid="tab-wallet"]');
    await expect(walletTab).toBeVisible();
    await walletTab.click();

    // 6. Assert initial balance is S/. 100.00
    const balanceField = page.locator('[data-testid="wallet-balance"]');
    await expect(balanceField).toBeVisible();
    await expect(balanceField).toContainText(/100\.00/);

    // 7. Click on generate QR code button
    const generateQrBtn = page.locator('[data-testid="btn-generate-yape-qr"]');
    await expect(generateQrBtn).toBeVisible();
    await generateQrBtn.click();

    // Verify QR code container is visible
    const qrContainer = page.locator('[data-testid="yape-qr-container"]');
    await expect(qrContainer).toBeVisible();

    // 8. Update our mock state: Balance is now S/. 114.25 (100 + 15 minus 5% commission = 14.25 net amount added)
    currentBalance = '114.25';

    // 9. Simulate the incoming payment webhook by issuing a post request using Playwright API client
    // In our E2E flow, we trigger the webhook route that backend would receive.
    // If testing strictly mocked frontend, we also mock the webhook confirmation payload.
    await page.route('**/api/v1/payments/webhooks/yape-plin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Webhook recibido y procesado',
          data: {
            transactionId: mockTxId,
            status: 'COMPLETED',
            netAmount: 14.25,
            feeAmount: 0.75
          }
        })
      });
    });

    // If frontend has a webhook simulator button for testing (common in dev/test panels)
    // we click it; otherwise, the frontend polls or receives event.
    // Let's check if there is a simulation button for testing in E2E environments
    const simulateWebhookBtn = page.locator('[data-testid="btn-simulate-webhook-success"]');
    if (await simulateWebhookBtn.isVisible()) {
      await simulateWebhookBtn.click();
    } else {
      // Direct API simulation: trigger the fetch for wallet details
      // by forcing frontend polling/fetch routine if exposed or re-loading
      await page.evaluate(() => {
        // Trigger any custom refresh events or force refetching in UI
        window.dispatchEvent(new Event('refresh-wallet-balance'));
      });
    }

    // 10. Assert that the balance dynamically updates in the DOM
    await expect(balanceField).toContainText(/114\.25/);
  });

});
