import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CRUD de Usuários', () => {
  let createdUserId: string;

  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'admin@impessa.com.br');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL(`${BASE_URL}/`);
  });

  test('1. Deve navegar para página de usuários', async ({ page }) => {
    // Clicar no item "Usuários" no sidebar
    await page.click('text=Usuários');

    // Aguardar navegação
    await page.waitForURL(`${BASE_URL}/usuarios`);

    // Verificar título
    await expect(page.locator('h1')).toContainText('Usuários');

    // Screenshot
    await page.screenshot({ path: 'screenshots-usuarios/01-lista-usuarios.png', fullPage: true });
  });

  test('2. Deve acessar formulário de novo usuário', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`);

    // Clicar no botão "Novo Usuário"
    await page.click('text=Novo Usuário');

    // Aguardar navegação
    await page.waitForURL(`${BASE_URL}/usuarios/novo`);

    // Verificar título
    await expect(page.locator('h1')).toContainText('Novo Usuário');

    // Screenshot
    await page.screenshot({ path: 'screenshots-usuarios/02-novo-usuario-form.png', fullPage: true });
  });

  test('3. Deve criar um novo usuário e enviar convite', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios/novo`);

    // Preencher formulário
    const timestamp = Date.now();
    const email = `teste${timestamp}@exemplo.com`;

    await page.fill('input[type="email"]', email);

    // Selecionar loja (primeira opção)
    await page.click('[id="lojaId"]');
    await page.click('[role="option"]', { timeout: 5000 });

    // Selecionar perfil (Membro)
    await page.click('[id="role"]');
    await page.click('text=Membro', { timeout: 5000 });

    // Screenshot do formulário preenchido
    await page.screenshot({ path: 'screenshots-usuarios/03-novo-usuario-preenchido.png', fullPage: true });

    // Submeter formulário
    await page.click('text=Criar Usuário e Enviar Convite');

    // Aguardar alert de sucesso
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('sucesso');
      await dialog.accept();
    });

    // Aguardar redirecionamento
    await page.waitForURL(`${BASE_URL}/usuarios`, { timeout: 10000 });

    // Verificar que o usuário aparece na lista
    await expect(page.locator(`text=${email}`)).toBeVisible({ timeout: 5000 });

    // Guardar o ID do usuário para testes posteriores
    const row = page.locator(`tr:has-text("${email}")`);
    const editButton = row.locator('button[title="Editar"]');
    await editButton.click();

    // Pegar ID da URL
    await page.waitForURL(/\/usuarios\/[a-f0-9-]+/);
    const url = page.url();
    createdUserId = url.split('/').pop() || '';

    // Screenshot da lista com novo usuário
    await page.goto(`${BASE_URL}/usuarios`);
    await page.screenshot({ path: 'screenshots-usuarios/04-lista-com-novo-usuario.png', fullPage: true });
  });

  test('4. Deve editar um usuário existente', async ({ page }) => {
    // Primeiro criar um usuário
    await page.goto(`${BASE_URL}/usuarios/novo`);

    const timestamp = Date.now();
    const email = `teste${timestamp}@exemplo.com`;

    await page.fill('input[type="email"]', email);
    await page.click('[id="lojaId"]');
    await page.click('[role="option"]', { timeout: 5000 });
    await page.click('[id="role"]');
    await page.click('text=Membro', { timeout: 5000 });
    await page.click('text=Criar Usuário e Enviar Convite');

    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await page.waitForURL(`${BASE_URL}/usuarios`);

    // Aguardar o usuário aparecer
    await page.waitForSelector(`text=${email}`);

    // Clicar em editar
    const row = page.locator(`tr:has-text("${email}")`);
    await row.locator('button[title="Editar"]').click();

    await page.waitForURL(/\/usuarios\/[a-f0-9-]+/);

    // Screenshot do formulário de edição
    await page.screenshot({ path: 'screenshots-usuarios/05-editar-usuario-form.png', fullPage: true });

    // Mudar o perfil para Secretário
    await page.click('[id="role"]');
    await page.click('text=Secretário', { timeout: 5000 });

    // Screenshot do formulário editado
    await page.screenshot({ path: 'screenshots-usuarios/06-editar-usuario-modificado.png', fullPage: true });

    // Salvar alterações
    await page.click('text=Salvar Alterações');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('sucesso');
      await dialog.accept();
    });

    await page.waitForURL(`${BASE_URL}/usuarios`);

    // Verificar que o perfil foi atualizado
    const updatedRow = page.locator(`tr:has-text("${email}")`);
    await expect(updatedRow.locator('text=Secretário')).toBeVisible();

    // Screenshot da lista atualizada
    await page.screenshot({ path: 'screenshots-usuarios/07-lista-usuario-editado.png', fullPage: true });
  });

  test('5. Deve reenviar convite para usuário', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`);

    // Procurar um usuário com status "Convidado"
    const invitedUser = page.locator('tr:has-text("Convidado")').first();

    // Se não houver, criar um
    const count = await invitedUser.count();
    if (count === 0) {
      await page.click('text=Novo Usuário');
      const timestamp = Date.now();
      await page.fill('input[type="email"]', `invite${timestamp}@exemplo.com`);
      await page.click('[id="lojaId"]');
      await page.click('[role="option"]', { timeout: 5000 });
      await page.click('text=Criar Usuário e Enviar Convite');
      page.once('dialog', async dialog => await dialog.accept());
      await page.waitForURL(`${BASE_URL}/usuarios`);
    }

    // Agora tentar reenviar convite
    const userRow = page.locator('tr:has-text("Convidado")').first();
    await userRow.locator('button[title="Reenviar convite"]').click();

    // Confirmar diálogo
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    // Aguardar mensagem de sucesso
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('sucesso');
      await dialog.accept();
    });

    // Screenshot
    await page.screenshot({ path: 'screenshots-usuarios/08-reenviar-convite.png', fullPage: true });
  });

  test('6. Deve deletar um usuário', async ({ page }) => {
    // Primeiro criar um usuário
    await page.goto(`${BASE_URL}/usuarios/novo`);

    const timestamp = Date.now();
    const email = `deletar${timestamp}@exemplo.com`;

    await page.fill('input[type="email"]', email);
    await page.click('[id="lojaId"]');
    await page.click('[role="option"]', { timeout: 5000 });
    await page.click('text=Criar Usuário e Enviar Convite');

    page.once('dialog', async dialog => await dialog.accept());

    await page.waitForURL(`${BASE_URL}/usuarios`);
    await page.waitForSelector(`text=${email}`);

    // Clicar no botão de deletar
    const row = page.locator(`tr:has-text("${email}")`);
    await row.locator('button[title="Deletar"]').click();

    // Screenshot do dialog de confirmação
    await page.screenshot({ path: 'screenshots-usuarios/09-confirmar-deletar.png', fullPage: true });

    // Confirmar deleção
    await page.click('text=Deletar');

    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('sucesso');
      await dialog.accept();
    });

    // Aguardar usuário sumir da lista
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${email}`)).not.toBeVisible();

    // Screenshot da lista sem o usuário
    await page.screenshot({ path: 'screenshots-usuarios/10-usuario-deletado.png', fullPage: true });
  });

  test('7. Deve filtrar usuários por email', async ({ page }) => {
    await page.goto(`${BASE_URL}/usuarios`);

    // Digitar no campo de busca
    await page.fill('input[placeholder*="Buscar"]', 'admin@impessa');

    // Aguardar filtro ser aplicado
    await page.waitForTimeout(500);

    // Verificar que apenas usuários com esse email aparecem
    await expect(page.locator('text=admin@impessa.com.br')).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'screenshots-usuarios/11-filtro-email.png', fullPage: true });
  });
});
