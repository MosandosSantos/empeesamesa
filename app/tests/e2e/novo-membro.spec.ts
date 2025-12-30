import { test, expect, type Page } from '@playwright/test';

test.describe('Novo Membro - Create Member Flow', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    const isLoggedIn = await page.locator('input[placeholder="Buscar..."]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      await page.fill('input[name="email"], input[type="email"]', 'admin@lojamaconica.com.br');
      await page.fill('input[name="password"], input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForSelector('input[placeholder="Buscar..."]', { timeout: 15000 });
    }
  });

  const skipIfNoLojas = async (page: Page) => {
    const fieldset = page.locator('form fieldset');
    await fieldset.waitFor({ state: 'attached' });
    const formDisabled = await fieldset.isDisabled().catch(() => false);
    const noLojasAlert = await page.getByText(/Nenhuma loja ativa/i).isVisible().catch(() => false);
    if (formDisabled || noLojasAlert) {
      test.skip();
    }
  };

  const nextStep = async (page: Page, expectedHeading?: RegExp) => {
    const nextButton = page.locator('button.bg-emerald-600');
    await expect(nextButton).toBeVisible();
    await Promise.all([
      nextButton.click(),
      expectedHeading
        ? page.getByRole('heading', { name: expectedHeading }).waitFor({ state: 'visible' })
        : page.waitForTimeout(200),
    ]);
  };

  const ensureFinalStep = async (page: Page) => {
    const submitButton = page.locator('button[type="submit"]');
    for (let i = 0; i < 3; i += 1) {
      if (await submitButton.isVisible().catch(() => false)) {
        return;
      }
      const nextButton = page.locator('button.bg-emerald-600');
      if (!(await nextButton.isVisible().catch(() => false))) {
        break;
      }
      await nextButton.click();
      await page.waitForTimeout(200);
    }
    await expect(submitButton).toBeVisible();
  };

  test('should successfully create a new member with all required fields', async ({ page }) => {
    await page.goto('/membros/novo');
    await expect(page.getByRole('heading', { name: 'Novo Membro' })).toBeVisible();

    await skipIfNoLojas(page);

    const timestamp = Date.now().toString().slice(-9);
    const uniqueCPF = `${timestamp.slice(0, 3)}.${timestamp.slice(3, 6)}.${timestamp.slice(6, 9)}-00`;

    await page.locator('input[placeholder="Digite o nome completo"]').fill('Jose de Arimateia');
    await page.locator('input[placeholder="000.000.000-00"]').fill(uniqueCPF);
    await page.locator('input[type="date"]').first().fill('1970-01-01');
    await nextStep(page, /Contato/i);

    await page.locator('input[placeholder="email@exemplo.com"]').fill('jose.arimateia@example.com');
    await page.locator('input[placeholder="(00) 00000-0000"]').first().fill('(11) 98765-4321');
    await nextStep(page, /Dados Ritual/i);

    await page.getByRole('combobox', { name: /Loja/i }).first().selectOption({ index: 1 });
    await page.getByRole('combobox', { name: /Rito/i }).selectOption('RER');
    await page.getByRole('combobox', { name: /Classe/i }).selectOption('MESA');
    await page.getByLabel(/entrada na loja/i).fill('2019-01-01');
    await page.getByLabel(/Data de adm/i).fill('2020-01-01');
    await nextStep(page, /Hist/i);

    const historyDates = page.locator('input[type="date"]');
    await historyDates.nth(0).fill('2015-01-01');
    await historyDates.nth(1).fill('2016-01-01');
    await historyDates.nth(2).fill('2017-01-01');
    await nextStep(page, /Classes/i);
    await ensureFinalStep(page);
    await page.locator('input[type="date"]').first().fill('2018-01-01');

    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible().catch(() => false)) {
      await expect(submitButton).toBeEnabled();
      await Promise.all([
        page.waitForURL('/membros', { timeout: 15000 }),
        submitButton.click(),
      ]);
    }
    await expect(page).toHaveURL('/membros');
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await page.goto('/membros/novo');
    await expect(page.getByRole('heading', { name: 'Novo Membro' })).toBeVisible();

    await skipIfNoLojas(page);

    await nextStep(page, /Contato/i);
    await nextStep(page, /Dados Ritual/i);
    await nextStep(page, /Hist/i);
    await nextStep(page, /Classes/i);

    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/Por favor, preencha|Campos obrigat/i).first()).toBeVisible();
    await expect(page).toHaveURL('/membros/novo');
  });
});
