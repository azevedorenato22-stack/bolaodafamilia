const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Hardcoded URL to ensure connection works regardless of container env
const DATABASE_URL = "postgresql://neondb_owner:npg_DAPRrZT1Fv2e@ep-round-water-aih8mxs6-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function main() {
    console.log('Gerando hash da senha...');
    // Senha padrão: admin123
    const senhaHash = await bcrypt.hash('admin123', 10);

    console.log('Criando usuário Admin...');
    try {
        const user = await prisma.usuario.create({
            data: {
                nome: 'Administrador',
                usuario: 'admin',
                email: 'admin@bolao.com',
                senha: senhaHash,
                tipo: 'ADMIN',
                ativo: true
            }
        });
        console.log('✅ Usuário ADMIN criado com sucesso!');
        console.log('ID:', user.id);
        console.log('Usuario: admin');
        console.log('Senha: admin123');
    } catch (e) {
        if (e.code === 'P2002') {
            console.log('⚠️ Usuário já existe!');
        } else {
            console.error('❌ Erro ao criar usuário:', e);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
