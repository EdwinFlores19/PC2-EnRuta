import { test, expect } from '@playwright/test';

test.describe('Radar & On-Demand Service Assignment', () => {

  const mockIntersectionId = 'uuid-intersection-miraflores-1';
  const mockRequestId = 'uuid-request-service-54321';

  test('Caso A: Bloqueo de aceptación de servicio cuando el semáforo está en VERDE', async ({ page }) => {
    await page.route('**/api/v1/services/intersections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: mockIntersectionId,
              name: 'Av. Larco / Av. Benavides',
              latitude: -12.122,
              longitude: -77.029,
              lightColor: 'GREEN',
              updatedAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    await page.route('**/api/v1/services/requests', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: mockRequestId,
              pedestrianId: 'user-pedestrian-uuid',
              intersectionId: mockIntersectionId,
              status: 'BUSCANDO',
              startLatitude: -12.122,
              startLongitude: -77.029,
              createdAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    await page.goto('/chambea-ahora');

    const acceptBtn = page.locator('[data-testid="btn-accept-service"]');
    const isHiddenOrDisabled = await acceptBtn.isHidden() || await acceptBtn.isDisabled();
    expect(isHiddenOrDisabled).toBe(true);
  });

  test('Caso B: Aceptación exitosa de servicio cuando el semáforo está en ROJO', async ({ page }) => {
    await page.route('**/api/v1/services/intersections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: mockIntersectionId,
              name: 'Av. Larco / Av. Benavides',
              latitude: -12.122,
              longitude: -77.029,
              lightColor: 'RED',
              updatedAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    await page.route('**/api/v1/services/requests', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [
            {
              id: mockRequestId,
              pedestrianId: 'user-pedestrian-uuid',
              intersectionId: mockIntersectionId,
              status: 'BUSCANDO',
              startLatitude: -12.122,
              startLongitude: -77.029,
              createdAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    await page.route(`**/api/v1/services/request/${mockRequestId}/assign`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Servicio asignado correctamente',
          data: {
            id: mockRequestId,
            pedestrianId: 'user-pedestrian-uuid',
            workerId: 'worker-uuid-777',
            intersectionId: mockIntersectionId,
            status: 'ASIGNADO',
            assignedAt: new Date().toISOString()
          }
        })
      });
    });

    await page.route(`**/api/v1/services/request/${mockRequestId}/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            id: mockRequestId,
            status: 'EN_EJECUCION',
            lightColorSnapshot: 'RED',
            executedAt: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/chambea-ahora');

    const acceptBtn = page.locator('[data-testid="btn-accept-service"]');
    await expect(acceptBtn).toBeVisible();
    await expect(acceptBtn).toBeEnabled();
    await acceptBtn.click();

    const statusLabel = page.locator('[data-testid="status-in-progress"]');
    await expect(statusLabel).toBeVisible();
    await expect(statusLabel).toContainText(/en curso|ejecución/i);
  });

});
