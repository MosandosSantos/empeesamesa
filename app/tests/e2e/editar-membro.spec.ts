import { test, expect, type Page } from '@playwright/test';

test.describe('Editar Membro - Jose de Arimateia', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const isLoggedIn = await page.locator('input[placeholder="Buscar..."]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      await page.fill('input[type="email"]', 'admin@lojamaconica.com.br');
      await page.fill('input[type="password"]', 'admin123');
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

  test('should create Jose de Arimateia and then edit his data', async ({ page }) => {
    const timestamp = Date.now().toString().slice(-9);
    const uniqueCPF = `${timestamp.slice(0, 3)}.${timestamp.slice(3, 6)}.${timestamp.slice(6, 9)}-00`;

    await page.goto('/membros/novo');
    await expect(page.getByRole('heading', { name: 'Novo Membro' })).toBeVisible();
    await skipIfNoLojas(page);

    await page.locator('input[placeholder="Digite o nome completo"]').fill('Jose de Arimateia');
    await page.locator('input[placeholder="000.000.000-00"]').fill(uniqueCPF);
    await page.locator('input[type="date"]').first().fill('1970-01-01');
    await nextStep(page, /Contato/i);

    await page.locator('input[placeholder="email@exemplo.com"]').fill('jose.arimateia@rerteste.com');
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
    await page.waitForURL('/membros', { timeout: 15000 });

    await page.getByPlaceholder('Buscar por nome').fill('Jose de Arimateia');
    const editLink = page.locator('a[href*="/membros/"][href*="/editar"]').first();
    const href = await editLink.getAttribute('href');
    const memberId = href?.split('/')[2] || '';
    expect(memberId).toBeTruthy();

    await page.goto(`/membros/${memberId}/editar`);
    await expect(page.getByRole('heading', { name: /Editar Membro/i })).toBeVisible();

    await page.locator('input[placeholder="(00) 00000-0000"]').first().fill('(11) 91234-5678');

    const enDateInput = page.getByLabel(/Data EN/i);
    if (await enDateInput.isVisible()) {
      await enDateInput.fill('2019-01-01');
    }

    const cbcsDateInput = page.getByLabel(/Data CBCS/i);
    if (await cbcsDateInput.isVisible()) {
      await cbcsDateInput.fill('2020-01-01');
    }

    const editSubmitButton = page.locator('button[type="submit"]:not([disabled])');
    await Promise.all([
      page.waitForURL('/membros', { timeout: 15000 }),
      editSubmitButton.click(),
    ]);
    await page.waitForURL('/membros', { timeout: 15000 });
    await expect(page).toHaveURL('/membros');
  });
});
