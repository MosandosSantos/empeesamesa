import { test, expect, type Page } from '@playwright/test';

test.describe('Inventario - Novo item', () => {
  test.setTimeout(60000);

  const adminCreds = { email: 'admin@lojamaconica.com.br', password: 'admin123' };

  const loginIfNeeded = async (page: Page) => {
    await page.goto('/login');

    const isLoggedIn = await page
      .locator('input[placeholder="Buscar..."]')
      .isVisible()
      .catch(() => false);
    if (!isLoggedIn) {
      await page.fill('input[name="email"], input[type="email"]', adminCreds.email);
      await page.fill('input[name="password"], input[type="password"]', adminCreds.password);
      await page.click('button[type="submit"]');
      await page.waitForSelector('input[placeholder="Buscar..."]', { timeout: 15000 });
    }
  };

  test('deve incluir item com estoque minimo informado', async ({ page }) => {
    await loginIfNeeded(page);
    await page.goto('/inventario/novo');
    await expect(page.getByRole('heading', { name: /Novo item de inventario/i })).toBeVisible();

    const uniqueStamp = Date.now();
    const itemName = `Item Teste ${uniqueStamp}`;
    const sku = `SKU-${uniqueStamp}`;

    await page.getByLabel(/Nome/i).fill(itemName);
    await page.getByLabel(/SKU/i).fill(sku);
    await page.getByLabel(/Categoria/i).fill('Teste');
    await page.getByLabel(/Unidade/i).click();
    await page.getByRole('option', { name: 'un' }).click();
    await expect(page.getByLabel(/Estoque minimo/i)).toBeVisible();
    await page.getByLabel(/Estoque minimo/i).fill('5');
    await expect(page.getByLabel(/Ponto de reposicao/i)).toBeVisible();
    await page.getByLabel(/Ponto de reposicao/i).fill('8');
    await page.getByLabel(/Localizacao/i).fill('Deposito');
    await page.getByLabel(/Observacoes/i).fill('Observacao automatizada de teste');

    await Promise.all([
      page.waitForURL('/inventario', { timeout: 15000 }),
      page.getByRole('button', { name: /Salvar item/i }).click(),
    ]);

    const row = page.locator('tr', { hasText: itemName });
    await expect(row).toBeVisible();
    await expect(row).toContainText('5');
    await expect(row).toContainText('8');
  });
});
