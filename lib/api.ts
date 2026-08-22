// ============================================================
//  api.ts — tudo que o app fala com o Supabase passa por aqui
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cfg } from "./config";

let _sb: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_sb) return _sb;
  _sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _sb;
}

function baseUrl(): string {
  return `${cfg.supabaseUrl}/functions/v1/api`;
}

async function chamar<T = any>(
  rota: string,
  opcoes: { metodo?: string; corpo?: any } = {},
): Promise<T> {
  const { metodo = "GET", corpo } = opcoes;
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error("O site ainda não foi conectado ao Supabase. Edite o arquivo config.json com sua URL e sua chave.");
  }
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;

  const resp = await fetch(baseUrl() + rota, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.supabaseAnonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.erro || "Não foi possível concluir. Tente de novo.");
  return json as T;
}

// ---------- tipos ----------
export type TipoSquad =
  | "leitura_biblica" | "livros" | "devocional"
  | "oracao" | "jejum" | "celebracao" | "gdc";

export interface Perfil {
  id: string; nome: string; email: string; avatar_url?: string;
  bio?: string; timezone: string; pontos_total: number;
  igreja?: string; ministerios?: string; data_nascimento?: string;
  instagram?: string; facebook?: string; tiktok?: string; youtube?: string;
  perfil_publico?: boolean;
}

export interface Squad {
  id: string; nome: string; tipo: TipoSquad; objetivo?: string; status: string;
  data_inicio: string; data_fim: string; streak_atual: number; streak_recorde: number;
  selo_dourado: boolean; pontos_total: number; total_periodos: number;
  valor_periodo: number; codigo_convite: string; criado_por: string;
  qtd_membros: number; periodos_concluidos: number;
}

export interface Periodo {
  id: string; indice: number; data_inicio: string; data_fim: string;
  status: "aguardando" | "em_andamento" | "concluido" | "falhou";
  pontos: number; autor_id?: string; profiles?: { nome: string; avatar_url?: string };
}

// ---------- catálogo ----------
export const TIPOS_SQUAD: Record<TipoSquad, { nome: string; frequencia: string; verbo: string }> = {
  leitura_biblica: { nome: "Leitura Bíblica", frequencia: "diário", verbo: "escrever a leitura do dia" },
  livros:          { nome: "Livros",          frequencia: "diário", verbo: "escrever sobre o capítulo" },
  devocional:      { nome: "Devocional",      frequencia: "diário", verbo: "escrever o devocional" },
  oracao:          { nome: "Oração",          frequencia: "diário", verbo: "registrar a oração do dia" },
  jejum:           { nome: "Jejum",           frequencia: "diário", verbo: "registrar o jejum do dia" },
  celebracao:      { nome: "Celebração",      frequencia: "semanal", verbo: "enviar a foto da celebração" },
  gdc:             { nome: "GDC",             frequencia: "semanal", verbo: "enviar a foto do GDC" },
};

export const ICONE_TIPO: Record<TipoSquad, string> = {
  leitura_biblica: "biblia",
  livros: "rolo",
  devocional: "vela",
  oracao: "terco",
  jejum: "pao",
  celebracao: "sinos",
  gdc: "peixes",
};

export const ehSemanal = (t: TipoSquad) => t === "celebracao" || t === "gdc";
export const precisaObjetivo = (t: TipoSquad) => t === "oracao" || t === "jejum";

// ---------- autenticação ----------
export const auth = {
  async cadastrar(nome: string, email: string, senha: string) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data, error } = await supabase().auth.signUp({
      email, password: senha, options: { data: { nome, timezone } },
    });
    if (error) throw new Error(traduzir(error.message));
    return data;
  },
  async entrar(email: string, senha: string) {
    const { data, error } = await supabase().auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(traduzir(error.message));
    return data;
  },
  async sair() { await supabase().auth.signOut(); },
  async sessao() { return (await supabase().auth.getSession()).data.session; },
  async recuperarSenha(email: string) {
    const { error } = await supabase().auth.resetPasswordForEmail(email);
    if (error) throw new Error(traduzir(error.message));
  },
};

function traduzir(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já tem cadastro.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um minuto.";
  return msg;
}

// ---------- API ----------
export const api = {
  meuPainel: () => chamar("/me"),
  atualizarPerfil: (dados: Partial<Perfil>) => chamar("/me", { metodo: "PATCH", corpo: dados }),

  listarSquads: () => chamar<{ squads: Squad[] }>("/squads"),
  criarSquad: (dados: {
    nome: string; tipo: TipoSquad; objetivo?: string; descricao?: string;
    data_inicio: string; data_fim: string;
  }) => chamar("/squads", { metodo: "POST", corpo: dados }),
  verSquad: (id: string) => chamar(`/squads/${id}`),
  editarSquad: (id: string, dados: {
    nome?: string; objetivo?: string; descricao?: string;
    data_inicio?: string; data_fim?: string;
  }) => chamar(`/squads/${id}`, { metodo: "PATCH", corpo: dados }),
  ativarSquad: (id: string) => chamar(`/squads/${id}/ativar`, { metodo: "POST" }),
  convidar: (id: string, email: string) =>
    chamar(`/squads/${id}/convidar`, { metodo: "POST", corpo: { email } }),
  calendario: (id: string) => chamar(`/squads/${id}/calendario`),
  galeria: (id: string) => chamar(`/squads/${id}/galeria`),
  sairDoSquad: (id: string) => chamar(`/squads/${id}/sair`, { metodo: "DELETE" }),
  cancelarConvite: (squadId: string, conviteId: string) =>
    chamar(`/squads/${squadId}/convites/${conviteId}`, { metodo: "DELETE" }),
  encerrarSquad: (id: string) => chamar(`/squads/${id}/encerrar`, { metodo: "POST" }),
  finalizarSquad: (id: string) => chamar(`/squads/${id}/finalizar`, { metodo: "POST" }),
  historico: () => chamar("/historico"),
  excluirSquad: (id: string) => chamar(`/squads/${id}`, { metodo: "DELETE" }),
  votarExclusao: (id: string, aprovado: boolean) =>
    chamar(`/squads/${id}/exclusao/votar`, { metodo: "POST", corpo: { aprovado } }),
  rede: (q = "") => chamar(`/rede?q=${encodeURIComponent(q)}`),
  verPrayer: (id: string) => chamar(`/prayer/${id}`),

  publicarArtigo: (squadId: string, dados: {
    period_id: string; titulo?: string; referencia?: string; conteudo: string;
  }) => chamar(`/squads/${squadId}/artigo`, { metodo: "POST", corpo: dados }),
  reagir: (postId: string, emoji: string) =>
    chamar(`/posts/${postId}/reagir`, { metodo: "POST", corpo: { emoji } }),

  enviarFoto: (squadId: string, dados: { period_id: string; foto_url: string; legenda?: string }) =>
    chamar(`/squads/${squadId}/foto`, { metodo: "POST", corpo: dados }),
  confirmarFoto: (fotoId: string) => chamar(`/fotos/${fotoId}/confirmar`, { metodo: "POST" }),

  convites: () => chamar("/convites"),
  responderConvite: (id: string, aceitar: boolean) =>
    chamar(`/convites/${id}/responder`, { metodo: "POST", corpo: { aceitar } }),
  aprovarConvite: (id: string, aprovado: boolean) =>
    chamar(`/convites/${id}/aprovar`, { metodo: "POST", corpo: { aprovado } }),

  notificacoes: () => chamar("/notificacoes"),
  marcarLidas: () => chamar("/notificacoes/ler", { metodo: "POST" }),
  emojis: () => chamar("/emojis"),
};

// ---------- upload de imagens ----------
export async function enviarImagem(arquivo: File, pasta: string): Promise<string> {
  if (arquivo.size > 6 * 1024 * 1024) {
    throw new Error("A imagem passa de 6 MB. Escolha uma menor.");
  }
  const ext = (arquivo.name.split(".").pop() || "jpg").toLowerCase();
  const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase().storage.from("galeria").upload(caminho, arquivo, {
    cacheControl: "3600", upsert: false,
  });
  if (error) throw new Error("Não foi possível enviar a foto. Tente outra imagem.");
  return supabase().storage.from("galeria").getPublicUrl(caminho).data.publicUrl;
}

export const enviarAvatar = (arquivo: File, userId: string) =>
  enviarImagem(arquivo, `avatares/${userId}`);

// ---------- datas ----------
export function dataBR(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function proximaSegunda(base = new Date()): string {
  const d = new Date(base);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 1 ? 0 : (8 - dow) % 7));
  return d.toISOString().slice(0, 10);
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function calcularIdade(nascimento?: string | null): number | null {
  if (!nascimento) return null;
  const n = new Date(nascimento + "T12:00:00");
  const hoje = new Date();
  let i = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) i--;
  return i >= 0 && i < 130 ? i : null;
}

export function linkRede(tipo: string, valor?: string | null): string | null {
  if (!valor) return null;
  const v = valor.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(v)) return v;
  const bases: Record<string, string> = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    tiktok: "https://tiktok.com/@",
    youtube: "https://youtube.com/@",
  };
  return bases[tipo] ? bases[tipo] + v : null;
}
