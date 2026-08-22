import { auth, api, type Perfil, type Squad } from "~/lib/api";

const perfil = ref<Perfil | null>(null);
const squads = ref<Squad[]>([]);
const naoLidas = ref(0);
const carregando = ref(true);

export function useSessao() {
  async function carregar() {
    carregando.value = true;
    try {
      const s = await auth.sessao();
      if (!s) { perfil.value = null; squads.value = []; return; }
      const r: any = await api.meuPainel();
      perfil.value = r.perfil;
      squads.value = r.squads ?? [];
      naoLidas.value = r.notificacoes_nao_lidas ?? 0;
    } catch { perfil.value = null; }
    finally { carregando.value = false; }
  }

  async function sair() {
    await auth.sair();
    perfil.value = null; squads.value = [];
    await navigateTo("/");
  }

  const logado = computed(() => !!perfil.value);
  const meuSquadCriado = computed(() =>
    squads.value.find((s) => s.criado_por === perfil.value?.id));

  return { perfil, squads, naoLidas, carregando, logado, meuSquadCriado, carregar, sair };
}
