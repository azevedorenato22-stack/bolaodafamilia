import api from '../lib/api';

export async function listarUsuarios() {
  const { data } = await api.get('/api/admin/usuarios');
  return data;
}

export async function criarUsuario(payload: {
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  tipo: 'ADMIN' | 'USUARIO';
}) {
  const { data } = await api.post('/api/admin/usuarios', payload);
  return data;
}

export async function atualizarUsuario(
  id: string,
  payload: {
    nome?: string;
    usuario?: string;
    email?: string;
    senha?: string;
    tipo?: 'ADMIN' | 'USUARIO';
    ativo?: boolean;
  },
) {
  const body = { ...payload };
  if (!body.senha) {
    delete (body as any).senha;
  }
  const { data } = await api.patch(`/api/admin/usuarios/${id}`, body);
  return data;
}

export async function toggleUsuario(id: string) {
  const { data } = await api.patch(`/api/admin/usuarios/${id}/toggle-active`);
  return data;
}

export async function excluirUsuario(id: string) {
  const { data } = await api.delete(`/api/admin/usuarios/${id}`);
  return data;
}
