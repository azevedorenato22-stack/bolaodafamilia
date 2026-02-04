import { PrismaClient, TipoUsuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Fluxo seguro por padrão:
  // - NÃO apaga dados
  // - NÃO cria dados demo
  // - apenas garante o admin (se não existir) e encerra
  const seedDemoData = (process.env.SEED_DEMO_DATA ?? '').toLowerCase() === 'true';
  console.log(`⚙️  Modo demo: ${seedDemoData ? 'ATIVADO (destrutivo)' : 'DESATIVADO (seguro)'}`);

  const adminWhere = {
    OR: [{ email: 'admin@bolaoamigos.com' }, { usuario: 'admin' }],
  };

  if (!seedDemoData) {
    const adminExistente = await prisma.usuario.findFirst({ where: adminWhere });
    if (adminExistente) {
      console.log(`✅ Admin já existe: ${adminExistente.email} (seed finalizado sem dados demo)\n`);
      return;
    }

    const senhaHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        usuario: 'admin',
        email: 'admin@bolaoamigos.com',
        senha: senhaHash,
        tipo: TipoUsuario.ADMIN,
        ativo: true,
      },
    });

    console.log(`✅ Admin criado: ${admin.email} (seed finalizado sem dados demo)\n`);
    console.log('👤 Usuário Admin: admin');
    console.log('🔑 Senha Admin: admin123\n');
    return;
  }

  // Modo demo (SEED_DEMO_DATA=true):
  // - limpa o banco (destrutivo)
  // - recria admin + dados de exemplo
  await prisma.palpiteCampeao.deleteMany();
  await prisma.palpite.deleteMany();
  await prisma.campeao.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.bolaoTime.deleteMany();
  await prisma.rodada.deleteMany();
  await prisma.time.deleteMany();
  await prisma.bolao.deleteMany();
  await prisma.mensagemDia.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🗑️  Dados anteriores removidos\n');

  // Criar usuário admin (demo)
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      usuario: 'admin',
      email: 'admin@bolaoamigos.com',
      senha: senhaHash,
      tipo: TipoUsuario.ADMIN,
      ativo: true,
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  // Criar usuários de teste
  const senhaUsuario = await bcrypt.hash('123456', 10);
  const usuarios = await Promise.all([
    prisma.usuario.create({
      data: {
        nome: 'João Silva',
        usuario: 'joao',
        email: 'joao@email.com',
        senha: senhaUsuario,
        tipo: TipoUsuario.USUARIO,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: 'Maria Santos',
        usuario: 'maria',
        email: 'maria@email.com',
        senha: senhaUsuario,
        tipo: TipoUsuario.USUARIO,
      },
    }),
    prisma.usuario.create({
      data: {
        nome: 'Pedro Costa',
        usuario: 'pedro',
        email: 'pedro@email.com',
        senha: senhaUsuario,
        tipo: TipoUsuario.USUARIO,
      },
    }),
  ]);
  console.log(`✅ ${usuarios.length} usuários criados\n`);

  // Criar times
  const times = await Promise.all([
    // Série A
    prisma.time.create({ data: { nome: 'Flamengo', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Palmeiras', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Corinthians', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'São Paulo', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Fluminense', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Botafogo', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Atlético-MG', categoria: 'Série A' } }),
    prisma.time.create({ data: { nome: 'Grêmio', categoria: 'Série A' } }),
  ]);
  console.log(`✅ ${times.length} times criados\n`);

  // Criar rodadas
  const rodadas = await Promise.all([
    prisma.rodada.create({ data: { nome: 'Rodada 1' } }),
    prisma.rodada.create({ data: { nome: 'Rodada 2' } }),
    prisma.rodada.create({ data: { nome: 'Quartas de Final' } }),
    prisma.rodada.create({ data: { nome: 'Semifinal' } }),
    prisma.rodada.create({ data: { nome: 'Final' } }),
  ]);
  console.log(`✅ ${rodadas.length} rodadas criadas\n`);

  // Criar bolão
  const bolao = await prisma.bolao.create({
    data: {
      nome: 'Brasileirão 2025',
      descricao: 'Bolão do Campeonato Brasileiro Série A 2025',
      dataFinal: new Date('2025-12-31'),
      ativo: true,
      ptsResultadoExato: 10,
      ptsVencedorGols: 6,
      ptsVencedor: 3,
      ptsGolsTime: 2,
      ptsCampeao: 20,
    },
  });
  console.log(`✅ Bolão criado: ${bolao.nome}\n`);

  // Vincular usuários participantes ao bolão
  await prisma.bolaoUsuario.createMany({
    data: usuarios.map((u) => ({
      bolaoId: bolao.id,
      usuarioId: u.id,
    })),
    skipDuplicates: true,
  });
  console.log(`✅ ${usuarios.length} participantes vinculados ao bolão\n`);

  // Vincular times ao bolão
  await Promise.all(
    times.map((time) =>
      prisma.bolaoTime.create({
        data: {
          bolaoId: bolao.id,
          timeId: time.id,
        },
      })
    )
  );
  console.log(`✅ ${times.length} times vinculados ao bolão\n`);

  // @ts-expect-error bolaoRodada existe após gerar o client com a nova tabela de relação
  await prisma.bolaoRodada.createMany({
    data: rodadas.map(rodada => ({
      bolaoId: bolao.id,
      rodadaId: rodada.id,
    })),
  });
  console.log(`✅ ${rodadas.length} rodadas vinculadas ao bolão\n`);

  // Criar jogos de exemplo
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(16, 0, 0, 0);

  const jogos = await Promise.all([
    prisma.jogo.create({
      data: {
        bolaoId: bolao.id,
        rodadaId: rodadas[0].id,
        timeCasaId: times[0].id, // Flamengo
        timeForaId: times[1].id, // Palmeiras
        dataHora: amanha,
        mataMata: false,
      },
    }),
    prisma.jogo.create({
      data: {
        bolaoId: bolao.id,
        rodadaId: rodadas[0].id,
        timeCasaId: times[2].id, // Corinthians
        timeForaId: times[3].id, // São Paulo
        dataHora: amanha,
        mataMata: false,
      },
    }),
  ]);
  console.log(`✅ ${jogos.length} jogos criados\n`);

  // Criar campeão
  const campeao = await prisma.campeao.create({
    data: {
      bolaoId: bolao.id,
      nome: 'Campeão Brasileiro 2025',
      dataLimite: new Date('2025-05-01'),
    },
  });
  console.log(`✅ Campeão criado: ${campeao.nome}\n`);

  // Criar mensagem do dia
  await prisma.mensagemDia.create({
    data: {
      conteudo: '🎉 Bem-vindo ao Bolão do Chuveiro Ligado! Faça seus palpites e boa sorte!',
      ativo: true,
    },
  });
  console.log('✅ Mensagem do dia criada\n');

  console.log('🎉 Seed concluído com sucesso!\n');
  console.log('👤 Usuário Admin: admin');
  console.log('🔑 Senha Admin: admin123\n');
  console.log('👤 Usuários: joao, maria, pedro');
  console.log('🔑 Senha Usuário: 123456\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
