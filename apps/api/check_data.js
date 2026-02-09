const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('=== Verificando dados do banco ===\n');

    // Bolões
    const boloes = await prisma.bolao.findMany();
    console.log('BOLÕES:');
    boloes.forEach(b => console.log(`  - ${b.nome} (ID: ${b.id})`));

    // Times
    const times = await prisma.time.findMany();
    console.log('\nTIMES:');
    times.forEach(t => console.log(`  - ${t.nome} (ID: ${t.id})`));

    // BolaoTime (vinculos)
    const bolaoTimes = await prisma.bolaoTime.findMany({
        include: {
            time: { select: { nome: true } },
            bolao: { select: { nome: true } }
        }
    });
    console.log('\nVÍNCULOS BOLÃO-TIME:');
    if (bolaoTimes.length === 0) {
        console.log('  ⚠️  NENHUM VÍNCULO ENCONTRADO! Precisa vincular os times ao bolão.');
    } else {
        bolaoTimes.forEach(bt => console.log(`  - Bolão "${bt.bolao.nome}" ↔ Time "${bt.time.nome}"`));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
