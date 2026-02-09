const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Gerando hash da senha...');
    const senhaHash = await bcrypt.hash('admin123', 10);

    console.log('Criando usuário Admin2...');
    try {
        const user = await prisma.usuario.create({
            data: {
                nome: 'admin2',
                usuario: 'admin2',
                email: 'admin2@bolao.local',
                senha: senhaHash,
                tipo: 'ADMIN',
            },
        });
        console.log('✅ Usuário Admin2 criado com sucesso!');
        console.log('   Nome: admin2');
        console.log('   Senha: admin123');
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('⚠️ Usuário admin2 já existe!');
        } else {
            throw error;
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
