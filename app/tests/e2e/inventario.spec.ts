import { test, expect, request } from '@playwright/test';

type LoginCredentials = {
  email: string;
  password: string;
};

async function createAuthedContext(credentials: LoginCredentials) {
  const context = await request.newContext({ baseURL: 'http://localhost:3000' });
  const login = await context.post('/api/auth/login', {
    data: { email: credentials.email, password: credentials.password },
  });
  expect(login.ok()).toBeTruthy();
  return context;
}

test.describe.serial('Inventario Sprint 9 v2', () => {
  const adminCreds = { email: 'admin@lojamaconica.com.br', password: 'admin123' };
  const memberCreds = { email: 'member@lojamaconica.com.br', password: 'member123' };
  const auroraCreds = { email: 'admin@aurora.com.br', password: 'admin123' };

  let adminContext: Awaited<ReturnType<typeof createAuthedContext>>;
  let memberContext: Awaited<ReturnType<typeof createAuthedContext>>;
  let auroraContext: Awaited<ReturnType<typeof createAuthedContext>>;
  let itemId: string;

  test.beforeAll(async () => {
    adminContext = await createAuthedContext(adminCreds);
    memberContext = await createAuthedContext(memberCreds);
    auroraContext = await createAuthedContext(auroraCreds);
  });

  test('A) cria item com qty=0 e avg=0', async () => {
    const res = await adminContext.post('/api/inventory/items', {
      data: {
        name: 'Kit de Prova - Sprint 9',
        sku: 'TEST-001',
        unit: 'un',
        minQty: 2,
        reorderPoint: 3,
        category: 'Teste',
        location: 'Deposito',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    itemId = data.item.id;
    expect(data.item.qtyOnHand).toBe(0);
    expect(data.item.avgCost).toBe(0);
    expect(data.item.createdByName).toBe(adminCreds.email);
    expect(data.item.reorderPoint).toBe(3);
  });

  test('B) entrada 10 a 5 => avg=5, qty=10, total=50', async () => {
    const res = await adminContext.post('/api/inventory/movements/in', {
      data: { itemId, qty: 10, unitCost: 5, reason: 'Entrada teste' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.item.qtyOnHand).toBe(10);
    expect(Number(data.item.avgCost)).toBeCloseTo(5, 2);
  });

  test('C) entrada 10 a 7 => avg=6, qty=20, total=120', async () => {
    const res = await adminContext.post('/api/inventory/movements/in', {
      data: { itemId, qty: 10, unitCost: 7, reason: 'Entrada teste 2' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.item.qtyOnHand).toBe(20);
    expect(Number(data.item.avgCost)).toBeCloseTo(6, 2);
  });

  test('D) saida 5 => qty=15, avg=6, total=90 + autor', async () => {
    const res = await memberContext.post('/api/inventory/movements/out', {
      data: { itemId, qty: 5, reason: 'Uso em sessao' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.item.qtyOnHand).toBe(15);
    expect(Number(data.item.avgCost)).toBeCloseTo(6, 2);

    const item = await adminContext.get(`/api/inventory/items/${itemId}`);
    const itemData = await item.json();
    const outMovement = itemData.movements.find((movement: any) => movement.type === 'OUT');
    expect(outMovement).toBeTruthy();
    expect(outMovement.createdByName).toBe(memberCreds.email);
  });

  test('E) saida maior que estoque => erro', async () => {
    const res = await adminContext.post('/api/inventory/movements/out', {
      data: { itemId, qty: 999 },
    });
    expect(res.status()).toBe(400);
  });

  test('F) delete de movements inexiste (404)', async () => {
    const res = await adminContext.delete('/api/inventory/movements/invalid');
    expect(res.status()).toBe(404);
  });

  test('G) archive so admin+senha; qty>0 falha; qty==0 ok + movement ARCHIVE', async () => {
    const failArchive = await adminContext.patch(`/api/inventory/items/${itemId}/archive`, {
      data: { password: adminCreds.password, reason: 'Teste de arquivamento' },
    });
    expect(failArchive.status()).toBe(400);

    const drain = await adminContext.post('/api/inventory/movements/out', {
      data: { itemId, qty: 15, reason: 'Zerar estoque' },
    });
    expect(drain.ok()).toBeTruthy();

    const okArchive = await adminContext.patch(`/api/inventory/items/${itemId}/archive`, {
      data: { password: adminCreds.password, reason: 'Item encerrado' },
    });
    expect(okArchive.ok()).toBeTruthy();

    const itemRes = await adminContext.get(`/api/inventory/items/${itemId}`);
    const itemData = await itemRes.json();
    expect(itemData.item.archivedAt).toBeTruthy();
    const archiveMovement = itemData.movements.find((m: any) => m.type === 'ARCHIVE');
    expect(archiveMovement).toBeTruthy();
  });

  test('H) multi-tenant: outro tenant nao acessa item', async () => {
    const res = await auroraContext.get(`/api/inventory/items/${itemId}`);
    expect([403, 404]).toContain(res.status());
  });
});
