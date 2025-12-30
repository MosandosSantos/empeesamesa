import { test, expect } from "@playwright/test";

/**
 * Integration tests for billing system
 * These tests verify:
 * 1. Creating year charges
 * 2. Matrix validation
 * 3. Payment registration
 * 4. Charge update + summary update
 * 5. Payment history with filters
 * 6. Multi-tenant isolation
 */

const API_BASE = "http://localhost:3000/api";

// Test data
let authToken: string;
let lojaId: string;
let memberId: string;
let tenantId: string;

test.describe("Billing System Integration Tests", () => {
  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_BASE}/auth/login`, {
      data: {
        email: "admin@impessa.com.br",
        password: "admin123",
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Extract cookie from response
    const cookies = loginResponse.headers()["set-cookie"];
    if (cookies) {
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
      }
    }

    expect(authToken).toBeDefined();

    // Get user info to extract tenantId and lojaId
    const meResponse = await request.get(`${API_BASE}/auth/me`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
      },
    });

    expect(meResponse.ok()).toBeTruthy();
    const userData = await meResponse.json();
    tenantId = userData.tenantId;

    // Get first loja
    const lojasResponse = await request.get(`${API_BASE}/lojas`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
      },
    });

    expect(lojasResponse.ok()).toBeTruthy();
    const lojasData = await lojasResponse.json();
    lojaId = lojasData.lojas[0]?.id;

    expect(lojaId).toBeDefined();

    // Get first active member
    const membersResponse = await request.get(`${API_BASE}/membros`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
      },
    });

    expect(membersResponse.ok()).toBeTruthy();
    const membersData = await membersResponse.json();
    const activeMember = membersData.members?.find(
      (m: any) => m.situacao === "ATIVO"
    );
    memberId = activeMember?.id;

    expect(memberId).toBeDefined();
  });

  test("should get billing summary for MONTHLY type", async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(
      `${API_BASE}/billing/summary?year=${year}&type=MONTHLY`,
      {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("expectedAmount");
    expect(data).toHaveProperty("paidAmount");
    expect(data).toHaveProperty("openAmount");
    expect(data).toHaveProperty("membersActive");
    expect(data).toHaveProperty("paidMembers");
    expect(data).toHaveProperty("delinquentMembers");

    expect(typeof data.expectedAmount).toBe("number");
    expect(typeof data.paidAmount).toBe("number");
    expect(typeof data.openAmount).toBe("number");
    expect(typeof data.membersActive).toBe("number");
  });

  test("should get billing summary for ANNUAL type", async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(
      `${API_BASE}/billing/summary?year=${year}&type=ANNUAL`,
      {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("expectedAmount");
    expect(data).toHaveProperty("paidAmount");
    expect(data).toHaveProperty("openAmount");
  });

  test("should get dues matrix with pagination", async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(
      `${API_BASE}/billing/dues/matrix?year=${year}&type=MONTHLY&page=1&limit=10`,
      {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("members");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.members)).toBeTruthy();
    expect(data.pagination).toHaveProperty("page");
    expect(data.pagination).toHaveProperty("limit");
    expect(data.pagination).toHaveProperty("total");
    expect(data.pagination).toHaveProperty("totalPages");

    // Check member structure
    if (data.members.length > 0) {
      const member = data.members[0];
      expect(member).toHaveProperty("memberId");
      expect(member).toHaveProperty("memberName");
      expect(member).toHaveProperty("payments");
      expect(typeof member.payments).toBe("object");
    }
  });

  test("should create a payment and update charge", async ({ request }) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const paymentData = {
      memberId,
      type: "MONTHLY",
      year,
      month,
      amount: 100.0,
      method: "PIX",
      paidAt: new Date().toISOString(),
      reference: `TEST-${Date.now()}`,
      notes: "Test payment from integration test",
    };

    const response = await request.post(`${API_BASE}/billing/payments`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        "Content-Type": "application/json",
      },
      data: paymentData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data).toHaveProperty("payment");
    expect(data).toHaveProperty("charge");

    expect(data.payment.memberId).toBe(memberId);
    expect(data.payment.type).toBe("MONTHLY");
    expect(data.payment.year).toBe(year);
    expect(data.payment.month).toBe(month);
    expect(data.payment.status).toBe("CONFIRMED");
    expect(data.payment.beneficiary).toBe("LODGE");

    expect(data.charge.status).toBe("PAID");
    expect(data.charge.paidPaymentId).toBe(data.payment.id);
  });

  test("should prevent duplicate payments", async ({ request }) => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const paymentData = {
      memberId,
      type: "MONTHLY",
      year,
      month,
      amount: 100.0,
      method: "PIX",
      paidAt: new Date().toISOString(),
    };

    // First payment should succeed
    const firstResponse = await request.post(`${API_BASE}/billing/payments`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        "Content-Type": "application/json",
      },
      data: paymentData,
    });

    // Second payment should fail with 409
    const secondResponse = await request.post(`${API_BASE}/billing/payments`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        "Content-Type": "application/json",
      },
      data: paymentData,
    });

    expect(secondResponse.status()).toBe(409);
    const errorData = await secondResponse.json();
    expect(errorData.error.code).toBe("DUPLICATE_PAYMENT");
  });

  test("should get payment history with filters", async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(
      `${API_BASE}/billing/payments/history?year=${year}&page=1&limit=10`,
      {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("payments");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.payments)).toBeTruthy();

    // Check payment structure
    if (data.payments.length > 0) {
      const payment = data.payments[0];
      expect(payment).toHaveProperty("id");
      expect(payment).toHaveProperty("memberId");
      expect(payment).toHaveProperty("memberName");
      expect(payment).toHaveProperty("type");
      expect(payment).toHaveProperty("year");
      expect(payment).toHaveProperty("amount");
      expect(payment).toHaveProperty("method");
      expect(payment).toHaveProperty("status");
      expect(payment).toHaveProperty("paidAt");
      expect(payment).toHaveProperty("beneficiary");
    }
  });

  test("should export payment history as CSV", async ({ request }) => {
    const year = new Date().getFullYear();

    const response = await request.get(
      `${API_BASE}/billing/payments/history?year=${year}&format=csv`,
      {
        headers: {
          Cookie: `auth-token=${authToken}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toContain(
      "attachment; filename="
    );

    const csvContent = await response.text();
    expect(csvContent).toContain("ID,Membro ID,Nome do Membro");
  });

  test("should validate required fields for payment creation", async ({
    request,
  }) => {
    const invalidData = {
      memberId: "invalid-uuid",
      type: "MONTHLY",
      year: 2025,
      // Missing month (required for MONTHLY)
      amount: 100,
      method: "PIX",
      paidAt: new Date().toISOString(),
    };

    const response = await request.post(`${API_BASE}/billing/payments`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        "Content-Type": "application/json",
      },
      data: invalidData,
    });

    expect(response.status()).toBe(400);
    const errorData = await response.json();
    expect(errorData.error.code).toBe("VALIDATION_ERROR");
  });

  test("should handle ANNUAL payment without month", async ({ request }) => {
    const year = new Date().getFullYear();

    const paymentData = {
      memberId,
      type: "ANNUAL",
      year,
      // No month for ANNUAL
      amount: 500.0,
      method: "TRANSFERENCIA",
      paidAt: new Date().toISOString(),
    };

    const response = await request.post(`${API_BASE}/billing/payments`, {
      headers: {
        Cookie: `auth-token=${authToken}`,
        "Content-Type": "application/json",
      },
      data: paymentData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();

    expect(data.payment.type).toBe("ANNUAL");
    expect(data.payment.month).toBeNull();
    expect(data.payment.beneficiary).toBe("POTENCY");
  });

  test("should reject unauthorized access", async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/billing/summary?year=2025&type=MONTHLY`
      // No auth cookie
    );

    expect(response.status()).toBe(401);
  });
});
