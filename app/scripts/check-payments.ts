import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Verificando Pagamentos no Banco ===\n');

  // Buscar todos os pagamentos
  const payments = await prisma.memberPayment.findMany({
    select: {
      id: true,
      memberId: true,
      paymentType: true,
      referenceMonth: true,
      referenceYear: true,
      amount: true,
      paymentMethod: true,
      paymentDate: true,
      member: {
        select: {
          nomeCompleto: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Total de pagamentos no banco: ${payments.length}\n`);

  payments.forEach((payment, index) => {
    console.log(`${index + 1}. ${payment.member.nomeCompleto}`);
    console.log(`   Tipo: ${payment.paymentType}`);
    console.log(`   Mês: ${payment.referenceMonth} | Ano: ${payment.referenceYear}`);
    console.log(`   Valor: R$ ${payment.amount}`);
    console.log(`   Método: ${payment.paymentMethod}`);
    console.log(`   Data: ${payment.paymentDate}`);
    console.log(`   ID do Membro: ${payment.memberId.substring(0, 8)}...`);
    console.log('');
  });

  // Verificar estrutura das chaves
  console.log('\n=== Chaves que seriam geradas (MONTHLY) ===\n');
  const monthlyPayments = payments.filter(p => p.paymentType === 'MENSALIDADE_LOJA');
  monthlyPayments.forEach((payment) => {
    const key = `${payment.memberId}-${payment.referenceYear}-${String(payment.referenceMonth ?? 0).padStart(2, '0')}`;
    console.log(`${payment.member.nomeCompleto}: ${key.substring(0, 50)}...`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
