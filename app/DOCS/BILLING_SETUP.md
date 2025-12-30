# Billing System Setup Guide

Quick setup guide for the EsferaORDO billing/dues management system.

## Overview

The billing system manages:
- **Monthly Dues (Mensalidades)** - Paid to Lodge
- **Annual Fees (Anuidades)** - Paid to Potency

## Installation

The billing system is already integrated into the main application. The database migration has been applied.

### Verify Installation

```bash
# Check that migration was applied
cd C:/Users/mosan/Documents/Sistemas/EsferaMesa/app
npm run db:studio
```

Look for these tables:
- `payment`
- `dues_charge`
- `kpi_snapshot`

## Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

### 2. Login

Use the default admin credentials:
- Email: `admin@impessa.com.br`
- Password: `admin123`

### 3. Import API Collection

Choose one:

**Option A: Postman**
```bash
# Import this file in Postman
docs/billing-api.postman.json
```

**Option B: Bruno**
```bash
# Import this file in Bruno
docs/billing-api.bruno.json
```

### 4. Set Variables

In your API client, set:
- `BASE_URL` = `http://localhost:3000/api`
- `TOKEN` = `<your-auth-token-from-login-cookie>`

### 5. Test Endpoints

Run requests in this order:

1. **Login** → Copy auth token from cookie
2. **Get Billing Summary** → Check system status
3. **Get Dues Matrix** → View member payment grid
4. **Create Payment** → Register a payment
5. **Get Payment History** → View payment records

## API Endpoints

### GET /api/billing/summary
Get KPIs for a period
```
?year=2025&type=MONTHLY
```

### GET /api/billing/dues/matrix
Get member × payment grid
```
?year=2025&type=MONTHLY&page=1&limit=10
```

### POST /api/billing/payments
Create a payment
```json
{
  "memberId": "uuid",
  "type": "MONTHLY",
  "year": 2025,
  "month": 1,
  "amount": 150.00,
  "method": "PIX",
  "paidAt": "2025-01-15T10:00:00.000Z"
}
```

### GET /api/billing/payments/history
Get payment history
```
?year=2025&format=json
```

For CSV export:
```
?year=2025&format=csv
```

## Testing

### Run Integration Tests

```bash
npm run test:e2e -- billing.spec.ts
```

### Run Load Test

```bash
tsx scripts/billing-load-test.ts
```

This will:
- Generate 1200 charges (100 members × 12 months)
- Measure query performance
- Validate < 200ms response times

## Common Tasks

### Generate Charges for a Year

Use the helper function in the API or create a script:

```typescript
import { generateChargesForPeriod } from "@/lib/billing-helpers";

// Generate charges for January 2025
await generateChargesForPeriod(
  tenantId,
  lojaId,
  "MONTHLY",
  2025,
  1,
  150.00 // expected amount
);
```

### Check Billing Status

```bash
curl "http://localhost:3000/api/billing/summary?year=2025&type=MONTHLY" \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

### Export Payments

```bash
curl "http://localhost:3000/api/billing/payments/history?year=2025&format=csv" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -o payments-2025.csv
```

## Troubleshooting

### Error: "Usuário não tem acesso a nenhuma loja"

**Solution:** User needs to be associated with a lodge. Check:
```sql
SELECT * FROM user WHERE email = 'your@email.com';
SELECT * FROM loja WHERE "tenantId" = '<tenant-id>';
```

### Performance Issues

**Check indexes:**
```sql
-- PostgreSQL
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('payment', 'dues_charge', 'kpi_snapshot');
```

**Enable query logging:**
```bash
DEBUG="prisma:query" npm run dev
```

### Duplicate Payment Error

This is expected behavior. The system prevents duplicate confirmed payments for the same member in the same period.

## Performance Benchmarks

Expected performance on typical hardware:

| Operation | Expected Time |
|-----------|---------------|
| Summary aggregation | < 200ms |
| Matrix query (50 members) | < 200ms |
| Payment creation | < 100ms |
| History query | < 200ms |

## Database Schema

### Payment Table
- Stores confirmed payments
- Links to Member and Loja
- Auto-sets beneficiary (LODGE/POTENCY)

### DuesCharge Table
- Represents expected payments
- Status: OPEN or PAID
- Prevents "searching for absence"

### KpiSnapshot Table
- Cached aggregates for performance
- Updated after payment creation
- Speeds up summary queries

## Multi-Tenant Support

All queries are automatically filtered by:
1. `tenantId` from JWT token
2. `lojaId` from user's lodge association

Users only see their own tenant/lodge data.

## Next Steps

1. Review complete API documentation: `docs/billing-api.md`
2. Customize expected amounts for your lodge
3. Generate charges for the current year
4. Integrate with frontend UI (to be developed)
5. Set up automated charge generation (cron job)

## Support

For issues or questions:
1. Check the full API documentation: `docs/billing-api.md`
2. Review integration tests: `tests/e2e/billing.spec.ts`
3. Run load test to verify performance: `tsx scripts/billing-load-test.ts`

## Files Reference

- **API Routes:** `src/app/api/billing/`
- **Validation Schemas:** `src/lib/validations/billing.ts`
- **Helper Functions:** `src/lib/billing-helpers.ts`
- **Database Schema:** `prisma/schema.prisma`
- **Migration:** `prisma/migrations/*/migration.sql`
- **Tests:** `tests/e2e/billing.spec.ts`
- **Load Test:** `scripts/billing-load-test.ts`
- **Documentation:** `docs/billing-api.md`
- **API Collections:** `docs/billing-api.*.json`
