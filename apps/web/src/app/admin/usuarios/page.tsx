'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  toggleUsuario,
  excluirUsuario,
} from '../../../services/usuarios.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminUsuariosPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  type TipoUsuarioForm = 'ADMIN' | 'USUARIO';
  type UsuarioFormState = {
    nome: string;
    usuario: string;
    email: string;
    senha: string;
    tipo: TipoUsuarioForm;
  };
  const emptyForm: UsuarioFormState = {
    nome: '',
    usuario: '',
    email: '',
    senha: '',
    tipo: 'USUARIO',
  };
  const [form, setForm] = useState<UsuarioFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch {
      setErro('Falha ao carregar usuários.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSaving(true);
    const isEditing = Boolean(editingId);
    try {
      if (editingId) {
        await atualizarUsuario(editingId, form);
      } else {
        await criarUsuario(form);
      }
      await load();
      setEditingId(null);
      setForm(emptyForm);
      setSucesso(isEditing ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao salvar usuário.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <p className="text-sm text-gray-600">Gerencie admins e usuários do sistema.</p>
      </div>
      {sucesso && <p className="text-sm text-green-700">{sucesso}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <form onSubmit={submit} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.usuario}
              onChange={e => setForm({ ...form, usuario: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Senha {editingId && '(deixe em branco p/ manter)'}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              placeholder={editingId ? '••••••' : ''}
              required={!editingId}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.tipo}
              onChange={e => setForm({ ...form, tipo: e.target.value as TipoUsuarioForm })}
            >
              <option value="USUARIO">Usuário</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : editingId ? 'Atualizar usuário' : 'Criar usuário'}
        </button>
        {editingId && (
          <button
            type="button"
            className="text-sm text-gray-600 underline ml-2 disabled:opacity-50"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
            disabled={isSaving}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b">Usuários</div>
        <div className="divide-y divide-gray-100">
          {usuarios.map(u => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {u.nome} {u.ativo ? '' : <span className="text-xs text-red-600">(inativo)</span>}
                </p>
                <p className="text-sm text-gray-600">
                  {u.usuario} • {u.email} • {u.tipo}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  className="text-primary-700 hover:text-primary-800"
                  onClick={() => {
                    setEditingId(u.id);
                    setForm({
                      nome: u.nome,
                      usuario: u.usuario,
                      email: u.email,
                      senha: '',
                      tipo: u.tipo as TipoUsuarioForm,
                    });
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-amber-700 hover:text-amber-800"
                  onClick={async () => {
                    try {
                      await toggleUsuario(u.id);
                      await load();
                    } catch {
                      setErro('Não foi possível alternar status.');
                    }
                  }}
                >
                  {u.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => setConfirmId(u.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {usuarios.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum usuário.</p>}
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá o usuário. Confirme para prosseguir."
          onCancel={() => setConfirmId(null)}
          onConfirm={async () => {
            setConfirmId(null);
            try {
              await excluirUsuario(confirmId);
              await load();
            } catch {
              setErro('Não foi possível excluir o usuário.');
            }
          }}
        />
      )}
    </div>
  );
}
