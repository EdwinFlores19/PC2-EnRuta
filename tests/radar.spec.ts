import { test, expect } from '@playwright/test';

/**
 * Suite 2: Motor de Asignación y Radar Uber
 * Establishes safety contracts for vian-on-demand services based on traffic lights.
 */
test.describe('Radar & On-Demand Service Assignment', () => {

  const mockIntersectionId = 'uuid-intersection-miraflores-1';
  const mockRequestId = 'uuid-request-service-54321';

  /**
   * Caso A: Bloqueo de Aceptación por Luz Verde
   * - Worker is at an intersection. Traffic light is GREEN.
   * - The button 'btn-accept-service' must be hidden or disabled.
   */
  test('Caso A: Bloqueo de aceptación de servicio cuando el semáforo está en VERDE', async ({ page }) => {
    // 1. Mock the intersections API to return a GREEN traffic light status
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
              lightColor: 'GREEN', // Traffic light is Green (High risk!)
              updatedAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    // Mock service requests list showing a pending request at this intersection
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

    // 2. Navigate to the radar view
    await page.goto('/chambea-ahora'); // Dashboard/radar page for workers

    // 3. Select the intersection on the radar or view details
    // Verify that the button 'btn-accept-service' is either disabled or completely hidden
    const acceptBtn = page.locator('[data-testid="btn-accept-service"]');
    
    // Safety check: The button must either not exist in the viewport, be hidden, or be disabled.
    const isHiddenOrDisabled = await acceptBtn.isHidden() || await acceptBtn.isDisabled();
    expect(isHiddenOrDisabled).toBe(true);
  });

  /**
   * Caso B: Servicio Aceptado con Luz Roja
   * - Traffic light is RED.
   * - Click 'btn-accept-service'.
   * - Verify transition to "Servicio en Curso" (status-in-progress).
   */
  test('Caso B: Aceptación exitosa de servicio cuando el semáforo está en ROJO', async ({ page }) => {
    // 1. Mock the intersections API to return a RED traffic light status
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
              lightColor: 'RED', // Traffic light is Red (Safe to cross!)
              updatedAt: new Date().toISOString()
            }
          ]
        })
      });
    });

    // Mock pending requests list
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

    // Mock assigning worker success response
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

    // Mock status transitions updates
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

    // 2. Navigate to the radar view
    await page.goto('/chambea-ahora');

    // 3. Locate the accept button, ensure it is enabled, and click it
    const acceptBtn = page.locator('[data-testid="btn-accept-service"]');
    await expect(acceptBtn).toBeVisible();
    await expect(acceptBtn).toBeEnabled();
    await acceptBtn.click();

    // 4. Verify that the interface transitions to "Servicio en Curso" (status-in-progress)
    const statusLabel = page.locator('[data-testid="status-in-progress"]');
    await expect(statusLabel).toBeVisible();
    await expect(statusLabel).toContainText(/en curso|ejecución/i);
  });

});
