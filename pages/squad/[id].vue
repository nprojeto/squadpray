<script setup lang="ts">
import { api, enviarImagem, TIPOS_SQUAD, EMOJI_REACAO, dataBR, hojeISO } from "~/lib/api";

const rota = useRoute();
const id = rota.params.id as string;
const { perfil, carregar: carregarSessao } = useSessao();

const dados = ref<any>(null);
const emojis = ref<any[]>([]);
const carregando = ref(true);
const erro = ref<string | null>(null);
const aviso = ref<string | null>(null);
const aba = ref<"hoje" | "historico" | "galeria" | "squad">("hoje");

const conteudo = ref("");
const titulo = ref("");
const referencia = ref("");
const salvando = ref(false);

const editando = ref(false);
const editInicio = ref(""); const editFim = ref(""); const salvandoDatas = ref(false);

function abrirEdicao() {
  editInicio.value = squad.value.data_inicio;
  editFim.value = squad.value.data_fim;
  editando.value = true;
}

const diasEditados = computed(() => {
  if (!editInicio.value || !editFim.value) return 0;
  return Math.floor((+new Date(editFim.value) - +new Date(editInicio.value)) / 86400000) + 1;
});

const edicaoValida = computed(() => semanal.value
  ? Math.floor(diasEditados.value / 7) >= 4
  : diasEditados.value >= 21);

async function salvarDatas() {
  erro.value = null; salvandoDatas.value = true;
  try {
    await api.editarSquad(id, { data_inicio: editInicio.value, data_fim: editFim.value });
    aviso.value = "Datas atualizadas.";
    editando.value = false;
    await buscar();
  } catch (e: any) { erro.value = e.message; }
  finally { salvandoDatas.value = false; }
}

const emailConvite = ref("");
const convidando = ref(false);

const arquivo = ref<File | null>(null);
const legenda = ref("");
const enviandoFoto = ref(false);

async function buscar() {
  try {
    const [d, e]: any = await Promise.all([api.verSquad(id), api.emojis()]);
    dados.value = d;
    emojis.value = e.emojis;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);

const squad = computed(() => dados.value?.squad);
const semanal = computed(() => !!dados.value?.semanal);
const membros = computed(() => dados.value?.membros ?? []);
const periodos = computed(() => dados.value?.periodos ?? []);
const souCriador = computed(() => squad.value?.criado_por === perfil.value?.id);

const periodoAtual = computed(() =>
  periodos.value.find((p: any) => p.data_inicio <= hojeISO() && hojeISO() <= p.data_fim));

const postAtual = computed(() =>
  dados.value?.posts?.find((p: any) => p.period_id === periodoAtual.value?.id));

const minhaVez = computed(() => periodoAtual.value?.autor_id === perfil.value?.id);

const proximoPeriodo = computed(() =>
  periodos.value.find((p: any) => p.data_inicio > hojeISO()));

const minhaFoto = computed(() =>
  dados.value?.fotos?.find((f: any) => f.period_id === periodoAtual.value?.id && f.user_id === perfil.value?.id));

const fotosDaSemana = computed(() =>
  (dados.value?.fotos ?? []).filter((f: any) => f.period_id === periodoAtual.value?.id));

const faltam = computed(() => Math.max(0, 200 - conteudo.value.trim().length));

async function publicar() {
  erro.value = null; salvando.value = true;
  try {
    await api.publicarArtigo(id, {
      period_id: periodoAtual.value.id,
      titulo: titulo.value || undefined,
      referencia: referencia.value || undefined,
      conteudo: conteudo.value,
    });
    conteudo.value = ""; titulo.value = ""; referencia.value = "";
    aviso.value = "Artigo publicado. Agora é a vez do squad reagir.";
    await buscar();
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}

async function reagir(codigo: string) {
  erro.value = null;
  try { await api.reagir(postAtual.value.id, codigo); await buscar(); }
  catch (e: any) { erro.value = e.message; }
}

async function convidar() {
  erro.value = null; aviso.value = null; convidando.value = true;
  try {
    const r: any = await api.convidar(id, emailConvite.value);
    aviso.value = r.cadastrado
      ? "Convite enviado. A pessoa vai ver na área de convites."
      : "Convite registrado. Peça para ela criar a conta com este mesmo e-mail.";
    emailConvite.value = "";
    await buscar();
  } catch (e: any) { erro.value = e.message; }
  finally { convidando.value = false; }
}

async function cancelarConvite(cid: string) {
  erro.value = null;
  try { await api.cancelarConvite(id, cid); aviso.value = "Convite cancelado."; await buscar(); }
  catch (e: any) { erro.value = e.message; }
}

const confirmandoEncerrar = ref(false);
async function encerrar() {
  erro.value = null;
  try {
    await api.encerrarSquad(id);
    aviso.value = "Squad encerrado. Os pontos deste ciclo não foram somados.";
    confirmandoEncerrar.value = false;
    await buscar();
  } catch (e: any) { erro.value = e.message; }
}

async function finalizar() {
  erro.value = null;
  try {
    const r: any = await api.finalizarSquad(id);
    aviso.value = r.erro ? r.erro : `Ciclo fechado. ${Number(r.pontos ?? 0).toFixed(1)} pontos foram somados para cada um.`;
    await buscar();
  } catch (e: any) { erro.value = e.message; }
}

const excluindo = ref(false);
async function excluirSquad() {
  erro.value = null;
  try {
    const r: any = await api.excluirSquad(id);
    if (r.excluido) { await carregarSessao(); await navigateTo("/painel"); return; }
    aviso.value = "Pedido enviado. O squad só some quando todos confirmarem.";
    excluindo.value = false;
    await buscar();
  } catch (e: any) { erro.value = e.message; }
}

async function votarExclusao(aprovado: boolean) {
  erro.value = null;
  try {
    const r: any = await api.votarExclusao(id, aprovado);
    if (r.excluido) { await carregarSessao(); await navigateTo("/painel"); return; }
    aviso.value = aprovado ? "Seu voto foi registrado." : "Você recusou a exclusão.";
    await buscar();
  } catch (e: any) { erro.value = e.message; }
}

const abertoId = ref<string | null>(null);
function alternarArtigo(pid: string) {
  abertoId.value = abertoId.value === pid ? null : pid;
}

async function reagirEm(postId: string, codigo: string) {
  erro.value = null;
  try { await api.reagir(postId, codigo); await buscar(); }
  catch (e: any) { erro.value = e.message; }
}

function resumo(texto: string, limite = 180) {
  const t = (texto ?? "").trim().replace(/\s+/g, " ");
  return t.length > limite ? t.slice(0, limite) + "…" : t;
}

const pedidoExclusao = computed(() => dados.value?.exclusao ?? null);
const jaVotei = computed(() =>
  pedidoExclusao.value?.exclusao_votos?.some((v: any) => v.user_id === perfil.value?.id));
const votosSim = computed(() =>
  pedidoExclusao.value?.exclusao_votos?.filter((v: any) => v.aprovado).length ?? 0);

const cicloTerminou = computed(() => !!squad.value && hojeISO() > squad.value.data_fim);

async function ativar() {
  erro.value = null;
  try { await api.ativarSquad(id); aviso.value = "O ciclo começou."; await buscar(); }
  catch (e: any) { erro.value = e.message; }
}

const faltamLegenda = computed(() => Math.max(0, 200 - legenda.value.trim().length));
const eFoto = ref<string | null>(null);
const eLegenda = ref<string | null>(null);

async function mandarFoto() {
  erro.value = null; eFoto.value = null; eLegenda.value = null;
  if (!arquivo.value) { eFoto.value = "Escolha a foto que comprova sua presença."; return; }
  if (faltamLegenda.value > 0) {
    eLegenda.value = `Conte o que você percebeu em pelo menos 200 caracteres. Faltam ${faltamLegenda.value}.`;
    return;
  }
  enviandoFoto.value = true;
  try {
    const url = await enviarImagem(arquivo.value, id);
    await api.enviarFoto(id, { period_id: periodoAtual.value.id, foto_url: url, legenda: legenda.value || undefined });
    arquivo.value = null; legenda.value = "";
    aviso.value = "Foto enviada. Agora o squad confirma.";
    await buscar();
  } catch (e: any) { erro.value = e.message; }
  finally { enviandoFoto.value = false; }
}

async function confirmarFoto(fid: string) {
  erro.value = null;
  try { await api.confirmarFoto(fid); await buscar(); }
  catch (e: any) { erro.value = e.message; }
}

function jaConfirmei(f: any) {
  return f.photo_confirmations?.some((c: any) => c.user_id === perfil.value?.id);
}
</script>

<template>
  <div v-if="carregando" class="text-fumaca">Carregando o squad…</div>
  <AvisoErro v-else-if="!squad" :mensagem="erro || 'Squad não encontrado.'" />

  <div v-else>
    <NuxtLink to="/painel" class="rotulo hover:text-tinta">← meus squads</NuxtLink>

    <header class="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="rotulo">{{ TIPOS_SQUAD[squad.tipo].nome }} · {{ dataBR(squad.data_inicio) }} a {{ dataBR(squad.data_fim) }}</p>
        <h1 class="text-4xl mt-2">{{ squad.nome }}</h1>
        <p v-if="squad.objetivo" class="text-fumaca mt-3 max-w-2xl">
          <span class="rotulo">Objetivo</span><br />{{ squad.objetivo }}
        </p>
      </div>
      <div class="flex -space-x-2">
        <AvatarPerfil
          v-for="m in membros" :key="m.id"
          :url="m.profiles.avatar_url" :nome="m.profiles.nome" :tamanho="40"
          :selo="squad.selo_dourado" :streak="squad.streak_atual"
        />
      </div>
    </header>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <AvisoErro :mensagem="aviso" tipo="ok" class="mt-6" />

    <section v-if="pedidoExclusao" class="painel p-6 mt-6 !border-laranja">
      <span class="rotulo">pedido para excluir o squad</span>
      <p class="font-semibold mt-2">
        {{ pedidoExclusao.profiles?.nome }} pediu para apagar este squad.
        Precisa da confirmação de todos — {{ votosSim }} de {{ membros.length }} já confirmaram.
      </p>
      <p class="text-sm text-fumaca font-semibold mt-2">
        Se todos confirmarem, o squad e todo o conteúdo dele somem para sempre.
      </p>
      <div v-if="!jaVotei" class="flex flex-wrap gap-3 mt-5">
        <button class="btn-ouro !bg-laranja !text-papel" @click="votarExclusao(true)">
          Confirmar exclusão
        </button>
        <button class="btn-vidro" @click="votarExclusao(false)">Recusar</button>
      </div>
      <p v-else class="font-marca text-lg text-laranja mt-4">você já respondeu</p>
    </section>

    <!-- squad ainda montando -->
    <section v-if="squad.status === 'rascunho'" class="painel p-7 mt-8">
      <h2 class="text-2xl">Montando o squad</h2>
      <p class="text-fumaca mt-2 text-sm">
        {{ membros.length }} {{ membros.length === 1 ? "pessoa" : "pessoas" }} no squad. O card abre com 2.
      </p>

      <div v-if="souCriador" class="mt-6 space-y-4">
        <div class="border-2 border-dashed border-risco rounded-lg p-4">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <p class="text-sm font-bold">
              {{ dataBR(squad.data_inicio) }} a {{ dataBR(squad.data_fim) }}
              <span class="font-normal text-fumaca">
                · {{ Math.floor((+new Date(squad.data_fim) - +new Date(squad.data_inicio)) / 86400000) + 1 }} dias
              </span>
            </p>
            <button v-if="!editando" class="btn-fantasma !py-1.5 text-xs" @click="abrirEdicao">
              Mudar datas
            </button>
          </div>

          <div v-if="editando" class="mt-4 space-y-3">
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label for="ei">Começa em</label>
                <input id="ei" v-model="editInicio" type="date" />
              </div>
              <div>
                <label for="ef">Termina em</label>
                <input id="ef" v-model="editFim" type="date" />
              </div>
            </div>
            <p class="text-xs font-semibold" :class="edicaoValida ? 'text-verde' : 'text-laranja'">
              <template v-if="semanal">
                {{ Math.floor(diasEditados / 7) }} encontros — o mínimo é 4.
              </template>
              <template v-else>{{ diasEditados }} dias — o mínimo é 21.</template>
            </p>
            <div class="flex gap-3">
              <button class="btn-ouro flex-1" :disabled="salvandoDatas || !edicaoValida" @click="salvarDatas">
                {{ salvandoDatas ? "Salvando…" : "Salvar datas" }}
              </button>
              <button class="btn-fantasma" @click="editando = false">Cancelar</button>
            </div>
          </div>
        </div>

        <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="convidar">
          <input v-model="emailConvite" type="email" required placeholder="e-mail de quem você quer convidar" />
          <button class="btn-vidro shrink-0" :disabled="convidando">Convidar</button>
        </form>

        <div v-if="dados.convites?.length">
          <p class="rotulo mb-2">Convites em aberto</p>
          <ul class="space-y-2">
            <li v-for="c in dados.convites" :key="c.id"
                class="flex items-center justify-between gap-3 border-2 border-dashed border-risco rounded-lg px-3 py-2">
              <span class="text-sm font-semibold break-all">
                {{ c.email }}
                <span class="block text-xs text-fumaca font-normal">
                  aguardando a pessoa aceitar
                </span>
              </span>
              <button class="btn-fantasma !px-3 !py-1.5 text-xs shrink-0" @click="cancelarConvite(c.id)">
                Cancelar
              </button>
            </li>
          </ul>
        </div>

        <button class="btn-ouro w-full" :disabled="membros.length < 2" @click="ativar">
          {{ membros.length < 2 ? `Falta ${2 - membros.length} para começar` : "Começar o ciclo" }}
        </button>
      </div>
      <p v-else class="text-fumaca text-sm mt-4">
        Aguardando quem criou o squad abrir o ciclo.
      </p>
    </section>

    <!-- squad ativo -->
    <template v-else>
      <CalendarioVitral
        class="mt-8"
        :periodos="periodos" :streak="squad.streak_atual" :recorde="squad.streak_recorde"
        :selo="squad.selo_dourado" :semanal="semanal" :pontos="squad.pontos_total"
      />

      <nav class="flex gap-1 mt-8 border-b border-tinta overflow-x-auto">
        <button
          v-for="t in (semanal ? ['hoje','galeria','squad'] : ['hoje','historico','squad'])" :key="t"
          class="px-4 py-3 text-sm border-b-2 -mb-px transition whitespace-nowrap"
          :class="aba === t ? 'border-ouro text-laranja' : 'border-transparent text-fumaca hover:text-tinta'"
          @click="aba = t as any"
        >
          {{ { hoje: semanal ? 'Esta semana' : 'Hoje', historico: 'Artigos', galeria: 'Galeria', squad: 'O squad' }[t] }}
        </button>
      </nav>

      <!-- HOJE -->
      <section v-if="aba === 'hoje'" class="mt-8 space-y-6">
        <div v-if="!periodoAtual" class="painel p-8 text-center">
          <EmojiCristao codigo="luz" :tamanho="42" class="mx-auto" />
          <p class="font-display text-2xl mt-3">Nada para fazer hoje</p>
          <p class="font-semibold text-fumaca text-sm mt-2">
            <template v-if="proximoPeriodo">
              O próximo {{ semanal ? 'ciclo' : 'dia' }} abre em {{ dataBR(proximoPeriodo.data_inicio) }}.
              Não dá para adiantar.
            </template>
            <template v-else>O ciclo deste squad já terminou.</template>
          </p>
        </div>

        <!-- DIÁRIO -->
        <template v-else-if="!semanal">
          <div class="painel p-6 sm:p-8">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="rotulo">Dia {{ periodoAtual.indice }} de {{ squad.total_periodos }} · {{ dataBR(periodoAtual.data_inicio) }}</p>
              <p class="text-sm">
                Na escala hoje:
                <span class="text-laranja">{{ minhaVez ? 'você' : periodoAtual.profiles?.nome }}</span>
              </p>
            </div>

            <!-- ainda não há artigo -->
            <div v-if="!postAtual" class="mt-6">
              <form v-if="minhaVez" class="space-y-4" @submit.prevent="publicar">
                <h2 class="text-2xl">É a sua vez de {{ TIPOS_SQUAD[squad.tipo].verbo }}</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label for="t">Título (opcional)</label>
                    <input id="t" v-model="titulo" placeholder="Um título para hoje" />
                  </div>
                  <div>
                    <label for="r">Referência (opcional)</label>
                    <input id="r" v-model="referencia" placeholder="Ex.: João 3 · Capítulo 4" />
                  </div>
                </div>
                <div>
                  <label for="c">Suas considerações</label>
                  <textarea id="c" v-model="conteudo" rows="9" required
                    placeholder="Escreva o que você leu, o que Deus falou e o que fica para o squad hoje." />
                  <p class="text-xs mt-1.5" :class="faltam ? 'text-fumaca' : 'text-verde'">
                    <span class="font-mono">{{ conteudo.trim().length }}</span> caracteres ·
                    {{ faltam ? `faltam ${faltam} para o mínimo` : 'mínimo atingido' }}
                  </p>
                </div>
                <button class="btn-ouro w-full" :disabled="salvando || faltam > 0">
                  {{ salvando ? "Publicando…" : "Publicar artigo do dia" }}
                </button>
              </form>

              <div v-else class="text-center py-8">
                <EmojiCristao codigo="oracao" :tamanho="44" class="mx-auto opacity-70" />
                <h2 class="text-xl mt-4">Esperando o artigo de {{ periodoAtual.profiles?.nome }}</h2>
                <p class="text-fumaca text-sm mt-2">
                  Quando ele publicar, entre e reaja para fechar o dia.
                </p>
              </div>
            </div>

            <!-- artigo publicado -->
            <article v-else class="mt-6">
              <h2 v-if="postAtual.titulo" class="text-2xl">{{ postAtual.titulo }}</h2>
              <p class="rotulo mt-2">
                {{ postAtual.profiles?.nome }}<template v-if="postAtual.referencia"> · {{ postAtual.referencia }}</template>
              </p>
              <p class="mt-5 leading-relaxed whitespace-pre-line text-tinta">{{ postAtual.conteudo }}</p>

              <div class="chumbo mt-7 pt-6">
                <BarraReacoes
                  :emojis="emojis" :reacoes="postAtual.post_reactions ?? []"
                  :meu-id="perfil?.id ?? ''" :sou-autor="postAtual.autor_id === perfil?.id"
                  @reagir="reagir"
                />
                <p class="text-xs text-fumaca mt-4">
                  Faltam
                  <span class="font-mono text-tinta">
                    {{ Math.max(0, membros.length - 1 - (postAtual.post_reactions?.length ?? 0)) }}
                  </span>
                  reações para o dia contar.
                </p>
              </div>
            </article>
          </div>
        </template>

        <!-- SEMANAL -->
        <template v-else>
          <div class="painel p-6 sm:p-8">
            <p class="rotulo">
              Semana {{ periodoAtual.indice }} de {{ squad.total_periodos }} ·
              {{ dataBR(periodoAtual.data_inicio) }} a {{ dataBR(periodoAtual.data_fim) }}
            </p>

            <form v-if="!minhaFoto" novalidate class="mt-6 space-y-4" @submit.prevent="mandarFoto">
              <h2 class="text-3xl">Envie sua foto da semana</h2>
              <p class="font-semibold text-sm text-fumaca">
                Uma foto que comprove sua presença e o que ficou de
                {{ squad.tipo === 'gdc' ? 'GDC' : 'celebração' }} para você. Depois o squad confirma.
              </p>

              <div>
                <label for="f">Foto</label>
                <input id="f" type="file" accept="image/*"
                  :class="eFoto ? '!border-laranja' : ''"
                  @change="arquivo = ($event.target as HTMLInputElement).files?.[0] ?? null; eFoto = null" />
                <CampoErro :mensagem="eFoto" />
              </div>

              <div>
                <label for="l">O que você percebeu</label>
                <textarea
                  id="l" v-model="legenda" rows="7"
                  :class="eLegenda ? '!border-laranja' : ''"
                  placeholder="O que Deus falou com você ali, o que te marcou, o que fica para o squad."
                  @input="eLegenda = null"
                />
                <p class="text-xs font-semibold mt-1.5" :class="faltamLegenda ? 'text-fumaca' : 'text-verde'">
                  <span class="font-mono">{{ legenda.trim().length }}</span> caracteres ·
                  {{ faltamLegenda ? `faltam ${faltamLegenda} para o mínimo` : 'mínimo atingido' }}
                </p>
                <CampoErro :mensagem="eLegenda" />
              </div>

              <button class="btn-ouro w-full" :disabled="enviandoFoto || faltamLegenda > 0 || !arquivo">
                {{ enviandoFoto ? "Enviando…" : "Enviar minha foto" }}
              </button>
            </form>

            <p v-else class="mt-6 text-verde text-sm">Sua foto desta semana já foi enviada.</p>

            <div class="chumbo mt-7 pt-6">
              <p class="rotulo mb-4">
                Fotos desta semana · {{ fotosDaSemana.length }} de {{ membros.length }}
              </p>
              <div class="grid sm:grid-cols-2 gap-4">
                <div v-for="f in fotosDaSemana" :key="f.id" class="rounded-xl border-2 border-tinta overflow-hidden bg-papel">
                  <img :src="f.foto_url" :alt="`Foto de ${f.profiles?.nome}`" class="w-full h-44 object-cover border-b-2 border-tinta" />
                  <div class="p-4">
                    <p class="font-bold text-sm">{{ f.profiles?.nome }}</p>
                    <p v-if="f.legenda" class="text-sm font-semibold mt-2 leading-relaxed">
                      {{ abertoId === f.id ? f.legenda : resumo(f.legenda, 140) }}
                    </p>
                    <button
                      v-if="f.legenda && f.legenda.length > 140"
                      class="btn-fantasma !px-0 !py-1 text-xs" @click="alternarArtigo(f.id)"
                    >{{ abertoId === f.id ? "Mostrar menos" : "Ler tudo" }}</button>
                    <p class="text-xs text-fumaca mt-2 font-mono">
                      {{ f.photo_confirmations?.length ?? 0 }} de {{ membros.length - 1 }} confirmaram
                    </p>
                    <button
                      v-if="f.user_id !== perfil?.id && !jaConfirmei(f)"
                      class="btn-vidro w-full mt-3 !py-2 text-sm"
                      @click="confirmarFoto(f.id)"
                    >Confirmar presença</button>
                    <p v-else-if="jaConfirmei(f)" class="text-xs text-verde mt-3">Você confirmou</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- HISTÓRICO -->
      <section v-if="aba === 'historico'" class="mt-8 space-y-4">
        <article v-for="p in dados.posts" :key="p.id" class="painel p-6">
          <div class="flex items-center justify-between gap-3">
            <p class="rotulo">{{ p.profiles?.nome }} · {{ dataBR(p.created_at) }}</p>
            <div class="flex gap-1">
              <span v-for="r in p.post_reactions" :key="r.id" class="text-base">{{ EMOJI_REACAO[r.emoji] ?? "✨" }}</span>
            </div>
          </div>
          <h3 v-if="p.titulo" class="text-xl mt-2">{{ p.titulo }}</h3>
          <p class="text-fumaca text-sm mt-3 leading-relaxed whitespace-pre-line line-clamp-6">{{ p.conteudo }}</p>
        </article>
        <p v-if="!dados.posts?.length" class="text-fumaca">Nenhum artigo publicado ainda.</p>
      </section>

      <!-- GALERIA -->
      <section v-if="aba === 'galeria'" class="mt-8">
        <div class="grid sm:grid-cols-3 gap-4">
          <figure v-for="f in dados.fotos" :key="f.id" class="rounded-xl border-2 border-tinta overflow-hidden bg-papel">
            <img :src="f.foto_url" :alt="`Foto de ${f.profiles?.nome}`" class="w-full h-40 object-cover border-b-2 border-tinta" />
            <figcaption class="p-3 text-xs">
              <span class="font-bold">{{ f.profiles?.nome }}</span>
              <span class="text-fumaca block mt-0.5">{{ dataBR(f.created_at) }}</span>
              <span v-if="f.legenda" class="block mt-2 font-semibold leading-relaxed">
                {{ abertoId === f.id ? f.legenda : resumo(f.legenda, 110) }}
              </span>
              <button
                v-if="f.legenda && f.legenda.length > 110"
                class="btn-fantasma !px-0 !py-1 text-xs" @click="alternarArtigo(f.id)"
              >{{ abertoId === f.id ? "Mostrar menos" : "Ler tudo" }}</button>
            </figcaption>
          </figure>
        </div>
        <p v-if="!dados.fotos?.length" class="text-fumaca">A galeria está vazia por enquanto.</p>
      </section>

      <!-- O SQUAD -->
      <section v-if="aba === 'squad'" class="mt-8 space-y-6">
        <div class="painel p-6">
          <p class="rotulo mb-4">Escala de quem escreve</p>
          <ol class="space-y-2">
            <li v-for="(m, i) in membros" :key="m.id" class="flex items-center gap-3 text-sm">
              <span class="font-mono text-fumaca w-6">{{ i + 1 }}</span>
              <NuxtLink :to="`/prayer/${m.profiles.id}`" class="flex items-center gap-3 flex-1 min-w-0 hover:text-laranja">
                <AvatarPerfil :url="m.profiles.avatar_url" :nome="m.profiles.nome" :tamanho="32" />
                <span class="font-bold truncate">{{ m.profiles.nome }}</span>
              </NuxtLink>
              <span v-if="m.papel === 'criador'" class="rotulo">criador</span>
              <span class="font-mono text-xs text-laranja">{{ Number(m.profiles.pontos_total).toFixed(0) }} pts</span>
            </li>
          </ol>
        </div>

        <div v-if="souCriador && squad.status === 'rascunho'" class="painel p-6">
          <p class="rotulo mb-3">Convidar mais alguém</p>
          <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="convidar">
            <input v-model="emailConvite" type="email" required placeholder="e-mail da pessoa" />
            <button class="btn-vidro shrink-0" :disabled="convidando">Convidar</button>
          </form>
          <p class="text-xs text-fumaca font-semibold mt-3">
            Assim que a pessoa aceitar, ela já entra no squad.
          </p>
        </div>

        <p v-else-if="souCriador && squad.status === 'ativo'" class="painel p-5 font-semibold text-sm">
          O ciclo já começou — não dá para incluir gente nova até o fim.
        </p>

        <div class="painel p-6">
          <p class="rotulo">Como funciona a pontuação aqui</p>
          <p class="text-sm text-fumaca mt-3">
            O ciclo tem <span class="font-mono text-tinta">{{ squad.total_periodos }}</span>
            {{ semanal ? 'semanas' : 'dias' }}. Cada um cumprido por todos vale
            <span class="font-mono text-laranja">{{ Number(squad.valor_periodo).toFixed(2) }}</span> pontos.
            Se uma pessoa falhar, ninguém pontua naquele período e o streak volta a zero —
            Os pontos de cada um só entram quando o ciclo chegar ao fim.
          </p>

          <div v-if="cicloTerminou && !squad.pontos_creditados && squad.status === 'ativo'" class="mt-5">
            <button class="btn-ouro w-full" @click="finalizar">Fechar ciclo e receber os pontos</button>
          </div>
        </div>

        <div v-if="souCriador && ['rascunho','ativo'].includes(squad.status)" class="painel p-6 border-laranja">
          <span class="rotulo">encerrar este squad</span>
          <p class="text-sm font-semibold mt-3">
            Encerrar antes do fim cancela o ciclo. O histórico fica guardado, mas
            <span class="bg-amarelo px-1">nenhum ponto é somado</span>.
          </p>
          <button v-if="!confirmandoEncerrar" class="btn-vidro mt-4" @click="confirmandoEncerrar = true">
            Encerrar squad
          </button>
          <div v-else class="flex flex-wrap gap-3 mt-4">
            <button class="btn-ouro !bg-laranja !text-papel" @click="encerrar">Sim, encerrar sem pontos</button>
            <button class="btn-fantasma" @click="confirmandoEncerrar = false">Voltar</button>
          </div>

          <div class="chumbo mt-6 pt-5">
            <p class="text-sm font-semibold">
              Excluir apaga o squad e todo o conteúdo.
              <template v-if="squad.status === 'rascunho'">Como o ciclo ainda não começou, some na hora.</template>
              <template v-else>Como o ciclo já começou, todos os membros precisam confirmar.</template>
            </p>
            <button v-if="!excluindo && !pedidoExclusao" class="btn-fantasma mt-3 !text-laranja" @click="excluindo = true">
              Excluir squad
            </button>
            <div v-else-if="excluindo" class="flex flex-wrap gap-3 mt-3">
              <button class="btn-ouro !bg-laranja !text-papel" @click="excluirSquad">
                {{ squad.status === 'rascunho' ? 'Sim, excluir agora' : 'Pedir exclusão ao squad' }}
              </button>
              <button class="btn-fantasma" @click="excluindo = false">Voltar</button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
