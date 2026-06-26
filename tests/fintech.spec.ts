import { test, expect } from '@playwright/test';

test.describe('Fintech Wallet & Educational Feature Gating', () => {

  const mockWalletId = 'uuid-wallet-98765';
  const mockTxId = 'uuid-tx-11111';
  const mockProviderTxId = 'yape-prov-tx-88888';

  test('Caso A: Bloqueo de billetera por falta de curso de educación financiera', async ({ page }) => {
    await page.route('**/api/v1/formalization/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            score: 45,
            semaphoreColor: 'RED',
            hasCompletedFinancialCourse: false
          }
        })
      });
    });

    await page.goto('/payments');

    const walletTab = page.locator('[data-testid="tab-wallet"]');
    await expect(walletTab).toBeVisible();
    await walletTab.click();

    const lockedModal = page.locator('[data-testid="locked-wallet-modal"]');
    await expect(lockedModal).toBeVisible();
    await expect(lockedModal).toContainText(/capacitación|curso|bloqueado/i);
  });

  test('Caso B: Cobro exitoso por Yape QR con actualización dinámica de saldo', async ({ page }) => {
    let currentBalance = '100.00';

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

    await page.route('**/api/v1/payments/wallet/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: mockWalletId,
            balance: currentBalance,
            currency: 'PEN',
            type: 'MERCHANT',
            transactions: []
          }
        })
      });
    });

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

    await page.goto('/payments');

    const walletTab = page.locator('[data-testid="tab-wallet"]');
    await expect(walletTab).toBeVisible();
    await walletTab.click();

    const balanceField = page.locator('[data-testid="wallet-balance"]');
    await expect(balanceField).toBeVisible();
    await expect(balanceField).toContainText(/100\.00/);

    const generateQrBtn = page.locator('[data-testid="btn-generate-yape-qr"]');
    await expect(generateQrBtn).toBeVisible();
    await generateQrBtn.click();

    const qrContainer = page.locator('[data-testid="yape-qr-container"]');
    await expect(qrContainer).toBeVisible();

    currentBalance = '114.25';

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

    const simulateWebhookBtn = page.locator('[data-testid="btn-simulate-webhook-success"]');
    if (await simulateWebhookBtn.isVisible()) {
      await simulateWebhookBtn.click();
    } else {
      await page.evaluate(() => {
        window.dispatchEvent(new Event('refresh-wallet-balance'));
      });
    }

    await expect(balanceField).toContainText(/114\.25/);
  });

});
