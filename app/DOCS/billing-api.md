# Billing API Documentation

Complete API documentation for the EsferaORDO billing/dues management system.

## Overview

The billing system manages monthly dues (mensalidades - paid to Lodge) and annual fees (anuidades - paid to Potency) for Masonic Lodge members.

### Base URL

```
http://localhost:3000/api/billing
```

### Authentication

All endpoints require authentication via JWT token in httpOnly cookie.

**Cookie Name:** `auth-token`

**Required Role:** Admin (LODGE_ADMIN or SAAS_ADMIN)

---

## Endpoints

### 1. GET /api/billing/summary

Get billing summary (KPIs) for a specific year and type.

#### Query Parameters

| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| year      | number | Yes      | Year (2000-2100)              |
| type      | string | Yes      | "MONTHLY" or "ANNUAL"         |

#### Response

**Status:** 200 OK

```json
{
  "expectedAmount": 18000.00,
  "paidAmount": 12000.00,
  "openAmount": 6000.00,
  "membersActive": 100,
  "paidMembers": 80,
  "delinquentMembers": 20
}
```

#### Response Fields

| Field             | Type   | Description                                    |
|-------------------|--------|------------------------------------------------|
| expectedAmount    | number | Total expected amount for the period           |
| paidAmount        | number | Total amount already paid                      |
| openAmount        | number | Outstanding amount (expected - paid)           |
| membersActive     | number | Count of active members                        |
| paidMembers       | number | Count of members who have paid                 |
| delinquentMembers | number | Count of members with outstanding payments     |

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/billing/summary?year=2025&type=MONTHLY" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Não autenticado"
  }
}
```

**403 Forbidden**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Usuário não tem acesso a nenhuma loja"
  }
}
```

**400 Bad Request**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parâmetros inválidos",
    "details": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "string",
        "path": ["year"],
        "message": "Expected number, received string"
      }
    ]
  }
}
```

---

### 2. GET /api/billing/dues/matrix

Get a paginated matrix of members × payment periods.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                           |
|-----------|--------|----------|---------|---------------------------------------|
| year      | number | Yes      | -       | Year (2000-2100)                     |
| type      | string | Yes      | -       | "MONTHLY" or "ANNUAL"                |
| page      | number | No       | 1       | Page number (min: 1)                 |
| limit     | number | No       | 50      | Results per page (max: 100)          |
| search    | string | No       | -       | Filter by member name (case-insensitive) |

#### Response

**Status:** 200 OK

```json
{
  "members": [
    {
      "memberId": "uuid-1234",
      "memberName": "João Silva",
      "payments": {
        "1": {
          "chargeId": "charge-uuid",
          "expectedAmount": 150.00,
          "status": "PAID",
          "payment": {
            "id": "payment-uuid",
            "amount": 150.00,
            "method": "PIX",
            "paidAt": "2025-01-15T10:00:00Z",
            "status": "CONFIRMED"
          }
        },
        "2": {
          "chargeId": "charge-uuid-2",
          "expectedAmount": 150.00,
          "status": "OPEN",
          "payment": null
        },
        "3": {
          "chargeId": null,
          "expectedAmount": 0,
          "status": "NOT_GENERATED",
          "payment": null
        }
        // ... months 4-12
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### Payment Status Values

- `PAID` - Payment confirmed
- `OPEN` - Charge exists but not paid
- `NOT_GENERATED` - No charge created for this period

#### Example Request

```bash
curl -X GET "http://localhost:3000/api/billing/dues/matrix?year=2025&type=MONTHLY&page=1&limit=10&search=silva" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

---

### 3. POST /api/billing/payments

Create a new payment and update related charge.

#### Request Body

```json
{
  "memberId": "uuid-1234",
  "type": "MONTHLY",
  "year": 2025,
  "month": 1,
  "amount": 150.00,
  "method": "PIX",
  "paidAt": "2025-01-15T10:00:00Z",
  "reference": "PIX-123456",
  "notes": "Payment via mobile app"
}
```

#### Request Fields

| Field    | Type   | Required | Description                                           |
|----------|--------|----------|-------------------------------------------------------|
| memberId | string | Yes      | UUID of the member                                    |
| type     | string | Yes      | "MONTHLY" or "ANNUAL"                                |
| year     | number | Yes      | Year (2000-2100)                                     |
| month    | number | Conditional | Required for MONTHLY (1-12), omit for ANNUAL     |
| amount   | number | Yes      | Payment amount (positive)                            |
| method   | string | Yes      | "PIX", "TRANSFERENCIA", "DINHEIRO", or "BOLETO"     |
| paidAt   | string | Yes      | ISO datetime when payment was made                   |
| reference| string | No       | Payment reference (e.g., transaction ID)             |
| notes    | string | No       | Additional notes                                     |

#### Response

**Status:** 201 Created

```json
{
  "payment": {
    "id": "payment-uuid",
    "tenantId": "tenant-uuid",
    "lojaId": "loja-uuid",
    "memberId": "member-uuid",
    "type": "MONTHLY",
    "year": 2025,
    "month": 1,
    "amount": 150.00,
    "method": "PIX",
    "status": "CONFIRMED",
    "paidAt": "2025-01-15T10:00:00Z",
    "beneficiary": "LODGE",
    "createdByUserId": "user-uuid",
    "reference": "PIX-123456",
    "notes": "Payment via mobile app",
    "createdAt": "2025-01-15T10:05:00Z",
    "updatedAt": "2025-01-15T10:05:00Z"
  },
  "charge": {
    "id": "charge-uuid",
    "tenantId": "tenant-uuid",
    "lojaId": "loja-uuid",
    "memberId": "member-uuid",
    "type": "MONTHLY",
    "year": 2025,
    "month": 1,
    "expectedAmount": 150.00,
    "status": "PAID",
    "paidPaymentId": "payment-uuid",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:05:00Z"
  }
}
```

#### Beneficiary Auto-Set Rules

- **MONTHLY** → `beneficiary = "LODGE"`
- **ANNUAL** → `beneficiary = "POTENCY"`

#### Example Request

```bash
curl -X POST "http://localhost:3000/api/billing/payments" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "uuid-1234",
    "type": "MONTHLY",
    "year": 2025,
    "month": 1,
    "amount": 150.00,
    "method": "PIX",
    "paidAt": "2025-01-15T10:00:00Z"
  }'
```

#### Error Responses

**404 Not Found**
```json
{
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "Membro não encontrado ou não pertence a esta loja"
  }
}
```

**409 Conflict**
```json
{
  "error": {
    "code": "DUPLICATE_PAYMENT",
    "message": "Já existe um pagamento confirmado para este período"
  }
}
```

---

### 4. GET /api/billing/payments/history

Get payment history with optional filters. Supports CSV export.

#### Query Parameters

| Parameter | Type   | Required | Default | Description                      |
|-----------|--------|----------|---------|----------------------------------|
| year      | number | No       | -       | Filter by year                   |
| month     | number | No       | -       | Filter by month (1-12)           |
| memberId  | string | No       | -       | Filter by member UUID            |
| page      | number | No       | 1       | Page number                      |
| limit     | number | No       | 50      | Results per page (max: 100)      |
| format    | string | No       | json    | "json" or "csv"                  |

#### Response (JSON)

**Status:** 200 OK

```json
{
  "payments": [
    {
      "id": "payment-uuid",
      "memberId": "member-uuid",
      "memberName": "João Silva",
      "type": "MONTHLY",
      "year": 2025,
      "month": 1,
      "amount": 150.00,
      "method": "PIX",
      "status": "CONFIRMED",
      "paidAt": "2025-01-15T10:00:00Z",
      "beneficiary": "LODGE",
      "reference": "PIX-123456",
      "notes": "Payment via mobile app",
      "createdAt": "2025-01-15T10:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### Response (CSV)

**Status:** 200 OK
**Content-Type:** text/csv

```csv
ID,Membro ID,Nome do Membro,Tipo,Ano,Mês,Valor,Método,Status,Data de Pagamento,Beneficiário,Referência,Observações,Criado em
payment-uuid,member-uuid,"João Silva",MONTHLY,2025,1,150.00,PIX,CONFIRMED,2025-01-15T10:00:00Z,LODGE,PIX-123456,"Payment via mobile app",2025-01-15T10:05:00Z
```

#### Example Requests

**JSON format:**
```bash
curl -X GET "http://localhost:3000/api/billing/payments/history?year=2025&page=1&limit=10" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

**CSV export:**
```bash
curl -X GET "http://localhost:3000/api/billing/payments/history?year=2025&format=csv" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -o payments.csv
```

---

## Data Types

### PaymentType

```typescript
type PaymentType = "MONTHLY" | "ANNUAL";
```

### PaymentMethod

```typescript
type PaymentMethod = "PIX" | "TRANSFERENCIA" | "DINHEIRO" | "BOLETO";
```

### PaymentStatus

```typescript
type PaymentStatus = "CONFIRMED" | "PENDING";
```

### ChargeStatus

```typescript
type ChargeStatus = "OPEN" | "PAID";
```

### Beneficiary

```typescript
type Beneficiary = "LODGE" | "POTENCY";
```

---

## Error Codes

| Code               | Status | Description                                    |
|--------------------|--------|------------------------------------------------|
| VALIDATION_ERROR   | 400    | Invalid request parameters or body             |
| UNAUTHORIZED       | 401    | Missing or invalid authentication              |
| FORBIDDEN          | 403    | User doesn't have access to the resource       |
| MEMBER_NOT_FOUND   | 404    | Member not found or doesn't belong to lodge    |
| CHARGE_NOT_FOUND   | 404    | Charge not found for the specified period      |
| DUPLICATE_PAYMENT  | 409    | Payment already exists for this period         |
| INTERNAL_ERROR     | 500    | Internal server error                          |

---

## Multi-Tenant Support

All endpoints automatically filter data by:

1. **tenantId** - Extracted from JWT token
2. **lojaId** - Extracted from authenticated user's lodge association

Users can only access data from their own tenant and lodge.

---

## Performance Considerations

### Query Optimization

- All queries use database indexes for optimal performance
- Expected response time: < 200ms for aggregate queries
- Matrix endpoint supports pagination to handle large datasets

### Indexes

The following indexes are created for optimal performance:

**Payment table:**
- `(tenantId)`
- `(lojaId)`
- `(lojaId, memberId, paidAt)`
- `(lojaId, type, year, month)`

**DuesCharge table:**
- `(tenantId, lojaId, type, year, month, memberId)` - UNIQUE
- `(lojaId, type, year, month, status)`
- `(memberId)`

**KpiSnapshot table:**
- `(tenantId, lojaId, type, year, month)` - UNIQUE
- `(lojaId, type, year, month)`

### N+1 Query Prevention

The matrix endpoint uses a single query with includes to fetch all related data, preventing N+1 query issues.

---

## Testing

### Integration Tests

Run integration tests with:

```bash
npm run test:e2e -- billing.spec.ts
```

### Load Testing

Run load test script:

```bash
tsx scripts/billing-load-test.ts
```

This will:
- Generate 1200 charges (100 members × 12 months)
- Measure endpoint response times
- Validate performance thresholds

---

## Examples

### Complete Workflow

#### 1. Check current billing status

```bash
curl -X GET "http://localhost:3000/api/billing/summary?year=2025&type=MONTHLY" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

#### 2. View payment matrix

```bash
curl -X GET "http://localhost:3000/api/billing/dues/matrix?year=2025&type=MONTHLY&page=1&limit=10" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

#### 3. Register a payment

```bash
curl -X POST "http://localhost:3000/api/billing/payments" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "member-uuid",
    "type": "MONTHLY",
    "year": 2025,
    "month": 1,
    "amount": 150.00,
    "method": "PIX",
    "paidAt": "2025-01-15T10:00:00.000Z"
  }'
```

#### 4. Export payment history

```bash
curl -X GET "http://localhost:3000/api/billing/payments/history?year=2025&format=csv" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -o payments-2025.csv
```

---

## Notes

1. **Automatic Beneficiary**: The system automatically sets the beneficiary based on payment type:
   - MONTHLY payments → LODGE
   - ANNUAL payments → POTENCY

2. **Charge Auto-Creation**: If a charge doesn't exist when creating a payment, it will be automatically created.

3. **KPI Snapshots**: Summaries are cached in KPI snapshots for better performance. These are updated asynchronously when payments are created.

4. **Duplicate Prevention**: The system prevents duplicate confirmed payments for the same member in the same period.

5. **Multi-Tenant Isolation**: All queries are automatically filtered by tenant and lodge context from the authenticated user.
