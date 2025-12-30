#!/usr/bin/env tsx
/**
 * Script de verificação de pagamentos registrados
 * Execute: npx tsx verificar-pagamentos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPagamentos() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍  VERIFICAÇÃO DE PAGAMENTOS DE MENSALIDADES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const payments = await prisma.memberPayment.findMany({
    include: {
      member: {
        select: {
          nomeCompleto: true,
        },
      },
      lancamento: {
        include: {
          categoria: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (payments.length === 0) {
    console.log('📭 Nenhum pagamento registrado ainda\n');
    console.log('💡 Para testar, acesse:');
    console.log('   http://localhost:3000/membros/14ab80fc-5414-4b65-be17-8c2a6ed7d191/pagamentos\n');
    return;
  }

  console.log(`✅ Total de pagamentos registrados: ${payments.length}\n`);

  let sucessos = 0;
  let falhas = 0;

  payments.forEach((payment, index) => {
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Pagamento #${index + 1} - ${payment.id}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`👤 Membro      : ${payment.member.nomeCompleto}`);
    console.log(`📋 Tipo        : ${payment.paymentType}`);

    if (payment.referenceMonth && payment.referenceYear) {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      console.log(`📅 Referência  : ${monthNames[payment.referenceMonth - 1]}/${payment.referenceYear}`);
    } else if (payment.referenceYear) {
      console.log(`📅 Referência  : Ano ${payment.referenceYear}`);
    }

    console.log(`💰 Valor       : R$ ${payment.amount.toFixed(2)}`);
    console.log(`📅 Data        : ${payment.paymentDate.toISOString().split('T')[0]}`);
    console.log(`📁 Categoria   : ${payment.lancamento.categoria.nome}`);
    console.log(`📝 Descrição   : ${payment.description}`);
    console.log();

    console.log('🎯 MODO DE PAGAMENTO:');

    const memberPM = payment.paymentMethod;
    const lancamentoPM = payment.lancamento.formaPagamento;

    console.log(`   MemberPayment.paymentMethod    : ${memberPM || '❌ NULL'}`);
    console.log(`   Lancamento.formaPagamento      : ${lancamentoPM || '❌ NULL'}`);
    console.log();

    if (memberPM && lancamentoPM) {
      if (memberPM === lancamentoPM) {
        console.log('   ✅ SUCESSO! paymentMethod gravado corretamente em ambas as tabelas!');
        sucessos++;
      } else {
        console.log('   ⚠️  ATENÇÃO! Valores divergentes:');
        console.log(`      MemberPayment: ${memberPM}`);
        console.log(`      Lancamento: ${lancamentoPM}`);
        falhas++;
      }
    } else {
      console.log('   ❌ FALHA! paymentMethod NÃO foi gravado!');
      falhas++;
    }

    console.log();
    console.log(`⏰ Criado em   : ${payment.createdAt.toLocaleString('pt-BR')}`);
    console.log();
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total de pagamentos: ${payments.length}`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log();

  if (falhas === 0 && sucessos > 0) {
    console.log('🎉🎉🎉 TODOS OS PAGAMENTOS ESTÃO CORRETOS! 🎉🎉🎉');
    console.log('');
    console.log('✨ O modo de pagamento está sendo gravado perfeitamente!');
    console.log('✨ Sprint 6 concluída com sucesso!');
  } else if (falhas > 0) {
    console.log('⚠️  Existem pagamentos com problemas.');
    console.log('💡 Registre um novo pagamento e verifique novamente.');
  }

  console.log();
}

verificarPagamentos()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
