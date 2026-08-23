import { auth, api, supabase, type Perfil, type Squad } from "~/lib/api";

const perfil = ref<Perfil | null>(null);
const squads = ref<Squad[]>([]);
const naoLidas = ref(0);
const convitesPendentes = ref(0);
const ehAdmin = ref(false);
const senhaProvisoria = ref(false);
const carregando = ref(true);
const temSessao = ref(false);
const falha = ref<string | null>(null);

export function useSessao() {
  async function carregar() {
    carregando.value = true;
    falha.value = null;
    try {
      const s = await auth.sessao();
      temSessao.value = !!s;
      if (!s) { perfil.value = null; squads.value = []; return; }

      // reserva: mesmo que a API falhe, o menu continua funcionando
      perfil.value = perfil.value ?? {
        id: s.user.id,
        nome: (s.user.user_metadata?.nome as string) || (s.user.email ?? "").split("@")[0],
        email: s.user.email ?? "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pontos_total: 0,
      } as Perfil;

      const r: any = await api.meuPainel();
      if (r.perfil) perfil.value = r.perfil;
      squads.value = r.squads ?? [];
      naoLidas.value = r.notificacoes_nao_lidas ?? 0;
      convitesPendentes.value = r.convites_pendentes ?? 0;
      ehAdmin.value = r.admin === true;
      senhaProvisoria.value = r.senha_provisoria === true;
    } catch (e: any) {
      const msg = e?.message ?? "Não foi possível carregar seus dados.";
      // sessão ainda sendo restaurada: tenta de novo antes de reclamar
      if (msg.includes("Faça login")) {
        try {
          const r: any = await api.meuPainel();
          if (r.perfil) perfil.value = r.perfil;
          squads.value = r.squads ?? [];
          naoLidas.value = r.notificacoes_nao_lidas ?? 0;
          convitesPendentes.value = r.convites_pendentes ?? 0;
          ehAdmin.value = r.admin === true;
          senhaProvisoria.value = r.senha_provisoria === true;
          return;
        } catch { /* segue para o aviso */ }
      }
      falha.value = msg;
    } finally {
      carregando.value = false;
    }
  }

  async function sair() {
    await auth.sair();
    perfil.value = null; squads.value = []; temSessao.value = false;
    await navigateTo("/");
  }

  const logado = computed(() => temSessao.value);
  const temSelo = computed(() => squads.value.some((s) => s.selo_dourado));
  const melhorStreak = computed(() =>
    squads.value.reduce((a, s) => Math.max(a, s.streak_atual ?? 0), 0));
  const meuSquadCriado = computed(() =>
    squads.value.find((s) => s.criado_por === perfil.value?.id &&
      ["rascunho", "ativo"].includes(s.status)));

  return { perfil, squads, naoLidas, convitesPendentes, ehAdmin, senhaProvisoria, carregando, falha, logado,
           temSelo, melhorStreak, meuSquadCriado, carregar, sair };
}
