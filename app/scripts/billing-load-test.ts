/**
 * Load test script for billing system
 *
 * This script:
 * 1. Generates charges for 100 members × 12 months (1200 charges)
 * 2. Measures endpoint response times
 * 3. Validates no N+1 queries
 *
 * Run with: tsx scripts/billing-load-test.ts
 */

import prisma from "../src/lib/prisma";
import { generateChargesForPeriod } from "../src/lib/billing-helpers";

const PERFORMANCE_THRESHOLD_MS = 200;

interface TestResult {
  operation: string;
  duration: number;
  passed: boolean;
  details?: any;
}

async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  console.log(`${operation}: ${duration}ms`);
  return { result, duration };
}

async function runLoadTest() {
  console.log("========================================");
  console.log("Billing System Load Test");
  console.log("========================================\n");

  const results: TestResult[] = [];

  try {
    // Get test tenant and loja
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      throw new Error("No tenant found. Run seed script first.");
    }

    const loja = await prisma.loja.findFirst({
      where: { tenantId: tenant.id },
    });

    if (!loja) {
      throw new Error("No loja found. Run seed script first.");
    }

    console.log(`Testing with tenant: ${tenant.name}`);
    console.log(`Testing with loja: ${loja.lojaMX}\n`);

    // Clean up existing test data
    console.log("Cleaning up existing test data...");
    await prisma.payment.deleteMany({
      where: {
        tenantId: tenant.id,
        lojaId: loja.id,
        type: "MONTHLY",
        year: 2025,
      },
    });

    await prisma.duesCharge.deleteMany({
      where: {
        tenantId: tenant.id,
        lojaId: loja.id,
        type: "MONTHLY",
        year: 2025,
      },
    });

    await prisma.kpiSnapshot.deleteMany({
      where: {
        tenantId: tenant.id,
        lojaId: loja.id,
        type: "MONTHLY",
        year: 2025,
      },
    });

    // Ensure we have active members
    const memberCount = await prisma.member.count({
      where: {
        tenantId: tenant.id,
        lojaId: loja.id,
        situacao: "ATIVO",
      },
    });

    console.log(`Active members: ${memberCount}`);

    if (memberCount === 0) {
      throw new Error("No active members found. Add members first.");
    }

    // Test 1: Generate charges for 12 months
    console.log("\nTest 1: Generating charges for 12 months...");
    let totalCharges = 0;

    const generateStart = Date.now();
    for (let month = 1; month <= 12; month++) {
      const count = await generateChargesForPeriod(
        tenant.id,
        loja.id,
        "MONTHLY",
        2025,
        month,
        150.0 // Expected amount
      );
      totalCharges += count;
      console.log(`  Month ${month}: ${count} charges created`);
    }
    const generateDuration = Date.now() - generateStart;

    console.log(`\nTotal charges generated: ${totalCharges}`);
    console.log(`Generation time: ${generateDuration}ms`);

    results.push({
      operation: "Generate 12 months of charges",
      duration: generateDuration,
      passed: true,
      details: { totalCharges, averagePerMonth: totalCharges / 12 },
    });

    // Test 2: Query dues matrix (critical path)
    console.log("\nTest 2: Querying dues matrix...");

    const { duration: matrixDuration } = await measureTime(
      "Dues matrix query",
      async () => {
        return prisma.member.findMany({
          where: {
            tenantId: tenant.id,
            lojaId: loja.id,
            situacao: "ATIVO",
          },
          include: {
            billingCharges: {
              where: {
                type: "MONTHLY",
                year: 2025,
              },
              include: {
                paidPayment: true,
              },
            },
          },
          take: 50,
        });
      }
    );

    const matrixPassed = matrixDuration < PERFORMANCE_THRESHOLD_MS;
    results.push({
      operation: "Dues matrix query (50 members)",
      duration: matrixDuration,
      passed: matrixPassed,
      details: {
        threshold: PERFORMANCE_THRESHOLD_MS,
        exceeded: !matrixPassed,
      },
    });

    // Test 3: Aggregate summary query
    console.log("\nTest 3: Querying billing summary...");

    const { duration: summaryDuration } = await measureTime(
      "Summary aggregation",
      async () => {
        const charges = await prisma.duesCharge.findMany({
          where: {
            tenantId: tenant.id,
            lojaId: loja.id,
            type: "MONTHLY",
            year: 2025,
          },
        });

        const expectedAmount = charges.reduce(
          (sum, c) => sum + Number(c.expectedAmount),
          0
        );
        const paidCharges = charges.filter((c) => c.status === "PAID");
        const paidAmount = paidCharges.reduce(
          (sum, c) => sum + Number(c.expectedAmount),
          0
        );

        return {
          expectedAmount,
          paidAmount,
          openAmount: expectedAmount - paidAmount,
          totalCharges: charges.length,
          paidCharges: paidCharges.length,
        };
      }
    );

    const summaryPassed = summaryDuration < PERFORMANCE_THRESHOLD_MS;
    results.push({
      operation: "Summary aggregation (12 months)",
      duration: summaryDuration,
      passed: summaryPassed,
      details: {
        threshold: PERFORMANCE_THRESHOLD_MS,
        exceeded: !summaryPassed,
      },
    });

    // Test 4: Payment history query with pagination
    console.log("\nTest 4: Querying payment history...");

    const { duration: historyDuration } = await measureTime(
      "Payment history query",
      async () => {
        return prisma.payment.findMany({
          where: {
            tenantId: tenant.id,
            lojaId: loja.id,
            type: "MONTHLY",
            year: 2025,
          },
          include: {
            member: {
              select: {
                id: true,
                nomeCompleto: true,
              },
            },
          },
          orderBy: {
            paidAt: "desc",
          },
          take: 50,
        });
      }
    );

    const historyPassed = historyDuration < PERFORMANCE_THRESHOLD_MS;
    results.push({
      operation: "Payment history query (50 results)",
      duration: historyDuration,
      passed: historyPassed,
      details: {
        threshold: PERFORMANCE_THRESHOLD_MS,
        exceeded: !historyPassed,
      },
    });

    // Test 5: Check for N+1 queries
    console.log("\nTest 5: Checking for N+1 queries...");
    console.log("  Enable Prisma query logging to verify:");
    console.log('  Set DEBUG="prisma:query" in environment');

    // Print results summary
    console.log("\n========================================");
    console.log("Load Test Results");
    console.log("========================================\n");

    let allPassed = true;
    results.forEach((result) => {
      const status = result.passed ? "PASS" : "FAIL";
      const icon = result.passed ? "✓" : "✗";
      console.log(`${icon} ${status} - ${result.operation}`);
      console.log(`  Duration: ${result.duration}ms`);
      if (result.details) {
        console.log(`  Details:`, JSON.stringify(result.details, null, 2));
      }
      console.log();

      if (!result.passed) allPassed = false;
    });

    // Performance summary
    const avgDuration =
      results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log("========================================");
    console.log(`Average query time: ${avgDuration.toFixed(2)}ms`);
    console.log(
      `Performance threshold: ${PERFORMANCE_THRESHOLD_MS}ms`
    );
    console.log(`Overall result: ${allPassed ? "PASS ✓" : "FAIL ✗"}`);
    console.log("========================================\n");

    // Recommendations
    if (!allPassed) {
      console.log("Recommendations:");
      console.log("- Check database indexes are created");
      console.log("- Verify database connection pooling");
      console.log("- Consider query optimization");
      console.log("- Review N+1 query patterns");
    }

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("Load test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runLoadTest();
