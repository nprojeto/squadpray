<script setup lang="ts">
import { api, TIPOS_SQUAD, dataBR } from "~/lib/api";

const { ehAdmin, carregando: carregandoSessao } = useSessao();

const aba = ref<"numeros" | "pessoas" | "squads">("numeros");
const dados = ref<any>(null);
const usuarios = ref<any[]>([]);
const termo = ref("");
const carregando = ref(true);
const erro = ref<string | null>(null);
const aviso = ref<string | null>(null);
let atraso: any;

const editando = ref<any>(null);
const salvando = ref(false);
const confirmandoReset = ref<string | null>(null);
const confirmandoExcluir = ref<string | null>(null);

async function carregarPainel() {
  carregando.value = true; erro.value = null;
  try { dados.value = await api.adminPainel(); }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}

async function carregarUsuarios() {
  try { const r: any = await api.adminUsuarios(termo.value.trim()); usuarios.value = r.usuarios ?? []; }
  catch (e: any) { erro.value = e.message; }
}

onMounted(async () => { await carregarPainel(); await carregarUsuarios(); });
watch(termo, () => { clearTimeout(atraso); atraso = setTimeout(carregarUsuarios, 350); });

function abrirEdicao(u: any) { editando.value = { ...u }; aviso.value = null; erro.value = null; }

async function salvarUsuario() {
  if (!editando.value) return;
  erro.value = null; salvando.value = true;
  try {
    const u = editando.value;
    await api.adminEditar(u.id, {
      nome: u.nome, email: u.email, bio: u.bio, igreja: u.igreja, ministerios: u.ministerios,
      data_nascimento: u.data_nascimento || null, instagram: u.instagram, facebook: u.facebook,
      tiktok: u.tiktok, youtube: u.youtube, perfil_publico: u.perfil_publico,
      admin: u.admin, pontos_total: Number(u.pontos_total ?? 0),
    });
    aviso.value = "Dados salvos.";
    editando.value = null;
    await carregarUsuarios(); await carregarPainel();
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}

async function resetar(id: string) {
  erro.value = null;
  try {
    await api.adminResetarSenha(id);
    aviso.value = "Senha redefinida para Mudar@123. A pessoa vai precisar criar uma nova ao entrar.";
    confirmandoReset.value = null;
    await carregarUsuarios();
  } catch (e: any) { erro.value = e.message; }
}

async function excluirUsuario(id: string) {
  erro.value = null;
  try {
    await api.adminExcluirUsuario(id);
    aviso.value = "Cadastro excluído.";
    confirmandoExcluir.value = null;
    await carregarUsuarios(); await carregarPainel();
  } catch (e: any) { erro.value = e.message; }
}

async function excluirSquad(id: string) {
  erro.value = null;
  try { await api.adminExcluirSquad(id); aviso.value = "Squad excluído."; await carregarPainel(); }
  catch (e: any) { erro.value = e.message; }
}

const n = computed(() => dados.value?.numeros ?? {});
const cartoes = computed(() => [
  { t: "Pessoas", v: n.value.pessoas, c: "bg-amarelo" },
  { t: "Squads", v: n.value.squads, c: "bg-roxo" },
  { t: "Ativos", v: n.value.squads_ativos, c: "bg-verde text-papel" },
  { t: "Montando", v: n.value.squads_rascunho, c: "bg-cartao" },
  { t: "Concluídos", v: n.value.squads_concluidos, c: "bg-cartao" },
  { t: "Cancelados", v: n.value.squads_cancelados, c: "bg-laranja text-papel" },
  { t: "Artigos", v: n.value.artigos, c: "bg-cartao" },
  { t: "Reações", v: n.value.reacoes, c: "bg-cartao" },
  { t: "Fotos", v: n.value.fotos, c: "bg-cartao" },
  { t: "Dias cumpridos", v: n.value.periodos_cumpridos, c: "bg-amarelo" },
  { t: "Dias perdidos", v: n.value.periodos_perdidos, c: "bg-laranja text-papel" },
  { t: "Maior streak", v: n.value.maior_streak, c: "bg-roxo" },
]);
</script>

<template>
  <div>
    <span class="rotulo text-xl">só para administradores</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Painel</h1>

    <p v-if="carregandoSessao" class="mt-8 font-semibold">Carregando…</p>

    <div v-else-if="!ehAdmin" class="painel p-8 mt-8 text-center">
      <EmojiCristao codigo="cruz" :tamanho="44" class="mx-auto" />
      <p class="font-display text-2xl mt-3">Área restrita</p>
      <p class="font-semibold text-fumaca text-sm mt-2">Esta página é só para administradores.</p>
      <NuxtLink to="/painel" class="btn-ouro mt-6">Voltar</NuxtLink>
    </div>

    <template v-else>
      <AvisoErro :mensagem="erro" class="mt-6" />
      <AvisoErro :mensagem="aviso" tipo="ok" class="mt-6" />

      <nav class="grid grid-cols-3 gap-2 mt-6">
        <button
          v-for="a in [{ k: 'numeros', t: 'Números' }, { k: 'pessoas', t: 'Pessoas' }, { k: 'squads', t: 'Squads' }]"
          :key="a.k"
          class="rounded-lg border-2 border-tinta px-2 py-2.5 font-display uppercase text-sm sm:text-lg transition"
          :class="aba === a.k ? 'bg-amarelo shadow-blocoP' : 'bg-cartao text-fumaca hover:bg-amarelo/40'"
          @click="aba = a.k as any"
        >{{ a.t }}</button>
      </nav>

      <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

      <!-- NÚMEROS -->
      <template v-else-if="aba === 'numeros'">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div v-for="c in cartoes" :key="c.t" class="border-2 border-tinta rounded-lg p-4 shadow-blocoP" :class="c.c">
            <p class="text-[10px] font-bold uppercase tracking-wider">{{ c.t }}</p>
            <p class="font-display text-3xl mt-1">{{ c.v ?? 0 }}</p>
          </div>
        </div>

        <div class="painel p-6 mt-6">
          <span class="rotulo">squads por tipo</span>
          <ul class="mt-3 grid sm:grid-cols-2 gap-2">
            <li v-for="(qtd, tipo) in (n.por_tipo ?? {})" :key="tipo"
                class="flex items-center justify-between border-2 border-dashed border-risco rounded-lg px-3 py-2">
              <span class="font-bold text-sm">{{ TIPOS_SQUAD[tipo as any]?.nome ?? tipo }}</span>
              <span class="font-mono font-bold">{{ qtd }}</span>
            </li>
          </ul>
          <p v-if="!Object.keys(n.por_tipo ?? {}).length" class="text-fumaca font-semibold text-sm mt-2">
            Nenhum squad criado ainda.
          </p>
        </div>

        <div class="painel p-6 mt-6">
          <span class="rotulo">últimos cadastros</span>
          <ul class="mt-3 space-y-2">
            <li v-for="u in dados?.recentes" :key="u.id" class="flex items-center gap-3">
              <AvatarPerfil :url="u.avatar_url" :nome="u.nome" :tamanho="34" />
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm truncate">{{ u.nome }}</p>
                <p class="text-xs text-fumaca truncate">{{ u.email }}</p>
              </div>
              <span class="text-xs font-mono">{{ dataBR(u.created_at) }}</span>
            </li>
          </ul>
        </div>
      </template>

      <!-- PESSOAS -->
      <template v-else-if="aba === 'pessoas'">
        <div class="mt-6">
          <label for="q" class="sr-only">Buscar</label>
          <input id="q" v-model="termo" placeholder="Nome, e-mail ou igreja" />
        </div>

        <ul class="mt-6 space-y-3">
          <li v-for="u in usuarios" :key="u.id" class="painel p-5">
            <div class="flex items-center gap-3">
              <AvatarPerfil :url="u.avatar_url" :nome="u.nome" :tamanho="44" />
              <div class="min-w-0 flex-1">
                <p class="font-display text-xl truncate">
                  {{ u.nome }}
                  <span v-if="u.admin" class="faixa bg-roxo text-[10px] ml-1">admin</span>
                </p>
                <p class="text-xs font-semibold text-fumaca truncate">{{ u.email }}</p>
                <p class="text-xs text-fumaca">
                  <span class="font-mono">{{ Number(u.pontos_total).toFixed(1) }}</span> pts
                  <template v-if="u.igreja"> · {{ u.igreja }}</template>
                  <template v-if="u.senha_provisoria"> · <span class="text-laranja font-bold">senha provisória</span></template>
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              <button class="btn-vidro !py-2 text-xs" @click="abrirEdicao(u)">Editar</button>
              <button
                v-if="confirmandoReset !== u.id" class="btn-fantasma !py-2 text-xs"
                @click="confirmandoReset = u.id"
              >Resetar senha</button>
              <template v-else>
                <button class="btn-ouro !py-2 text-xs" @click="resetar(u.id)">Confirmar reset</button>
                <button class="btn-fantasma !py-2 text-xs" @click="confirmandoReset = null">Voltar</button>
              </template>

              <button
                v-if="confirmandoExcluir !== u.id" class="btn-fantasma !py-2 text-xs !text-laranja"
                @click="confirmandoExcluir = u.id"
              >Excluir</button>
              <template v-else>
                <button class="btn-ouro !bg-laranja !text-papel !py-2 text-xs" @click="excluirUsuario(u.id)">
                  Confirmar exclusão
                </button>
                <button class="btn-fantasma !py-2 text-xs" @click="confirmandoExcluir = null">Voltar</button>
              </template>
            </div>
          </li>
        </ul>
      </template>

      <!-- SQUADS -->
      <template v-else>
        <ul class="mt-6 space-y-3">
          <li v-for="s in dados?.squads" :key="s.id" class="painel p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="faixa bg-amarelo text-xs -rotate-1">{{ TIPOS_SQUAD[s.tipo]?.nome }}</span>
                <p class="font-display text-xl mt-2 truncate">{{ s.nome }}</p>
                <p class="text-xs font-semibold text-fumaca">
                  {{ s.status }} · {{ s.qtd_membros }} pessoas ·
                  streak <span class="font-mono">{{ s.streak_atual }}</span> ·
                  <span class="font-mono">{{ Number(s.pontos_total).toFixed(1) }}</span> pts
                </p>
                <p class="text-xs text-fumaca mt-1">
                  {{ dataBR(s.data_inicio) }} — {{ dataBR(s.data_fim) }}
                </p>
              </div>
              <button class="btn-fantasma !py-2 text-xs !text-laranja shrink-0" @click="excluirSquad(s.id)">
                Excluir
              </button>
            </div>
          </li>
        </ul>
        <p v-if="!dados?.squads?.length" class="painel p-8 mt-6 text-center font-semibold">
          Nenhum squad na plataforma.
        </p>
      </template>

      <!-- EDIÇÃO -->
      <div v-if="editando" class="fixed inset-0 z-50 grid place-items-center p-4">
        <div class="absolute inset-0 bg-tinta/60" @click="editando = null" />
        <div class="relative painel p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-3xl">Editar cadastro</h2>
            <button class="btn-fantasma !px-3" @click="editando = null">✕</button>
          </div>

          <div class="space-y-3 mt-5">
            <div><label for="en">Nome</label><input id="en" v-model="editando.nome" /></div>
            <div><label for="ee">E-mail</label><input id="ee" v-model="editando.email" type="email" /></div>
            <div><label for="eb">Descrição</label><textarea id="eb" v-model="editando.bio" rows="2" /></div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label for="ei">Igreja</label><input id="ei" v-model="editando.igreja" /></div>
              <div><label for="ed">Nascimento</label><input id="ed" v-model="editando.data_nascimento" type="date" /></div>
            </div>
            <div><label for="em">Ministérios</label><input id="em" v-model="editando.ministerios" /></div>
            <div class="grid sm:grid-cols-2 gap-3">
              <div><label for="ein">Instagram</label><input id="ein" v-model="editando.instagram" /></div>
              <div><label for="ef">Facebook</label><input id="ef" v-model="editando.facebook" /></div>
              <div><label for="et">TikTok</label><input id="et" v-model="editando.tiktok" /></div>
              <div><label for="ey">YouTube</label><input id="ey" v-model="editando.youtube" /></div>
            </div>
            <div><label for="ep">Pontos</label><input id="ep" v-model="editando.pontos_total" type="number" step="0.1" /></div>

            <label class="flex items-center gap-3 border-2 border-tinta rounded-lg p-3 bg-cartao">
              <input v-model="editando.perfil_publico" type="checkbox" class="!w-5 !h-5 !p-0" />
              <span class="text-sm font-semibold">Perfil visível na rede</span>
            </label>
            <label class="flex items-center gap-3 border-2 border-tinta rounded-lg p-3 bg-cartao">
              <input v-model="editando.admin" type="checkbox" class="!w-5 !h-5 !p-0" />
              <span class="text-sm font-semibold">É administrador</span>
            </label>
          </div>

          <div class="flex gap-3 mt-6">
            <button class="btn-ouro flex-1" :disabled="salvando" @click="salvarUsuario">
              {{ salvando ? "Salvando…" : "Salvar" }}
            </button>
            <button class="btn-fantasma" @click="editando = null">Cancelar</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
