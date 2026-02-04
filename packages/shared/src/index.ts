// ============================================
// TIPOS COMPARTILHADOS - BOLÃO DOS AMIGOS
// ============================================

// Re-export dos tipos do Prisma
export type {
  Usuario,
  Bolao,
  Time,
  BolaoTime,
  Rodada,
  Jogo,
  Palpite,
  Campeao,
  PalpiteCampeao,
  MensagemDia,
} from 'database';

export { TipoUsuario, StatusJogo, VencedorPenaltis } from 'database';

// Auth types
export type {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponse,
  JwtPayload,
} from './types/auth.types';

// Bolao types
export interface CreateBolaoDto {
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  ativo?: boolean;
  pts_resultado_exato?: number;
  pts_vencedor_gols?: number;
  pts_vencedor?: number;
  pts_gols_time?: number;
  pts_campeao?: number;
  timeIds?: string[];
}

export interface UpdateBolaoDto {
  nome?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  ativo?: boolean;
  pts_resultado_exato?: number;
  pts_vencedor_gols?: number;
  pts_vencedor?: number;
  pts_gols_time?: number;
  pts_campeao?: number;
}

export interface BolaoComTimes {
  id: string;
  nome: string;
  descricao?: string;
  dataInicio: Date;
  dataFim: Date;
  ativo: boolean;
  pts_resultado_exato: number;
  pts_vencedor_gols: number;
  pts_vencedor: number;
  pts_gols_time: number;
  pts_campeao: number;
  times: Array<{
    id: string;
    nome: string;
    escudoUrl?: string;
  }>;
  totalRodadas?: number;
  totalJogos?: number;
  totalPalpites?: number;
}

// Time types
export interface CreateTimeDto {
  nome: string;
  categoria: string;
  sigla?: string;
  escudoUrl?: string;
}

export interface UpdateTimeDto {
  nome?: string;
  categoria?: string;
  sigla?: string;
  escudoUrl?: string;
}

export interface TimeComEstatisticas {
  id: string;
  nome: string;
  categoria: string;
  sigla?: string;
  escudoUrl?: string;
  totalBoloes: number;
  totalJogos: number;
  createdAt: Date;
  updatedAt: Date;
}

// Rodada types
export interface CreateRodadaDto {
  nome: string;
  numeroOrdem?: number;
  descricao?: string;
}

export interface UpdateRodadaDto {
  nome?: string;
  numeroOrdem?: number;
  descricao?: string;
}

export interface RodadaComEstatisticas {
  id: string;
  nome: string;
  numeroOrdem?: number;
  descricao?: string;
  totalJogos: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DTOs de Autenticação
// ============================================

// ============================================
// DTOs de Palpite
// ============================================

export interface CriarPalpiteDto {
  jogoId: string;
  golsCasa: number;
  golsFora: number;
  vencedorPenaltis?: 'CASA' | 'FORA';
}

export interface AtualizarPalpiteDto {
  golsCasa: number;
  golsFora: number;
  vencedorPenaltis?: 'CASA' | 'FORA';
}

// ============================================
// DTOs de Ranking
// ============================================

export interface RankingUsuario {
  posicao: number;
  usuarioId: string;
  nome: string;
  pontuacaoTotal: number;
  resultadosExatos: number;
  acertosVencedor: number;
  acertosGols: number;
}

export interface RankingBolao {
  bolaoId: string;
  bolaoNome: string;
  ranking: RankingUsuario[];
  atualizadoEm: Date;
}

// ============================================
// DTOs de Jogo
// ============================================

export interface JogoComTimes {
  id: string;
  bolaoId: string;
  rodadaId: string;
  rodadaNome: string;
  timeCasa: {
    id: string;
    nome: string;
    escudoUrl?: string;
  };
  timeFora: {
    id: string;
    nome: string;
    escudoUrl?: string;
  };
  dataHora: Date;
  status: 'PALPITES' | 'EM_ANDAMENTO' | 'ENCERRADO';
  mataMata: boolean;
  resultadoCasa?: number;
  resultadoFora?: number;
  vencedorPenaltis?: 'CASA' | 'FORA';
  palpiteBloqueado: boolean;
  meuPalpite?: {
    id: string;
    golsCasa: number;
    golsFora: number;
    vencedorPenaltis?: 'CASA' | 'FORA';
    pontuacao: number;
  };
}

// ============================================
// Utilitários
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Constantes
// ============================================

export const MINUTOS_BLOQUEIO_PALPITE = 15;

export const PONTUACAO_PADRAO = {
  RESULTADO_EXATO: 10,
  VENCEDOR_GOLS: 6,
  VENCEDOR: 3,
  GOLS_TIME: 2,
  CAMPEAO: 20,
  PENALTIS: 1,
} as const;
