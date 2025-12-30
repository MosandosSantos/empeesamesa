import prisma from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function Home() {
  const activeMembers = await prisma.member.count({ where: { situacao: "ATIVO" } });
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      minQty: { gt: 0 },
      archivedAt: null,
    },
    select: {
      minQty: true,
      qtyOnHand: true,
    },
  });
  const belowMinCount = lowStockItems.filter((item) => item.qtyOnHand <= item.minQty).length;

  const ritoCounts = await prisma.member.groupBy({
    by: ["rito"],
    _count: { _all: true },
    where: { situacao: "ATIVO" },
  });

  const classCounts = await prisma.member.groupBy({
    by: ["class"],
    _count: { _all: true },
    where: { situacao: "ATIVO" },
  });

  const riteDistribution = ritoCounts.map((item) => ({
    name: item.rito || "Nao informado",
    value: item._count._all,
  })).sort((a, b) => b.value - a.value);

  const classOrder = ["MESA", "EN", "CBCS"];
  const classMap = new Map(classCounts.map((item) => [item.class ?? "", item._count._all]));
  const classDistribution = classOrder.map((key) => ({
    name: key,
    value: classMap.get(key) ?? 0,
  }));

  return (
    <DashboardClient
      activeMembers={activeMembers}
      belowMinCount={belowMinCount}
      riteDistribution={riteDistribution}
      classDistribution={classDistribution}
    />
  );
}
