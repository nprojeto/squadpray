<script setup lang="ts">
import { api, TIPOS_SQUAD, calcularIdade, linkRede } from "~/lib/api";

const id = useRoute().params.id as string;
const dados = ref<any>(null); const carregando = ref(true); const erro = ref<string | null>(null);

onMounted(async () => {
  try { dados.value = await api.verPrayer(id); }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
});

const p = computed(() => dados.value?.prayer);
const idade = computed(() => calcularIdade(p.value?.data_nascimento));
const abertos = computed(() =>
  (dados.value?.squads ?? []).filter((s: any) => ["rascunho", "ativo"].includes(s.status)));
const encerrados = computed(() =>
  (dados.value?.squads ?? []).filter((s: any) => !["rascunho", "ativo"].includes(s.status)));

const base = useRuntimeConfig().app.baseURL;
const imagem = (c: string) => `${base.replace(/\/$/, "")}/selos/${c}.png`;
const conquistados = computed(() => (dados.value?.selos ?? []).filter((s: any) => s.conquistado));

const redes = computed(() => ([
  { nome: "Instagram", url: linkRede("instagram", p.value?.instagram) },
  { nome: "Facebook", url: linkRede("facebook", p.value?.facebook) },
  { nome: "TikTok", url: linkRede("tiktok", p.value?.tiktok) },
  { nome: "YouTube", url: linkRede("youtube", p.value?.youtube) },
].filter(r => r.url)));
</script>

<template>
  <div class="max-w-2xl">
    <NuxtLink to="/rede" class="rotulo">← voltar para a rede</NuxtLink>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <template v-else-if="p">
      <section class="painel p-6 sm:p-7 mt-6">
        <div class="flex items-center gap-5 flex-wrap">
          <AvatarPerfil :url="p.avatar_url" :nome="p.nome" :tamanho="90" />
          <div>
            <h1 class="text-4xl">{{ p.nome }}</h1>
            <p v-if="idade !== null" class="font-marca text-lg text-laranja">{{ idade }} anos</p>
          </div>
        </div>

        <div v-if="dados.restrito" class="chumbo mt-6 pt-5">
          <template v-if="dados.motivo === 'meu_perfil_fechado'">
            <p class="font-semibold">
              Seu perfil está fechado, então você também não vê o perfil dos outros.
              A rede funciona nos dois sentidos.
            </p>
            <NuxtLink to="/perfil" class="btn-ouro mt-4">Abrir meu perfil</NuxtLink>
          </template>
          <p v-else class="font-semibold">
            Este prayer mantém o perfil fechado. Só o nome e a foto ficam visíveis.
          </p>
        </div>

        <template v-else>
          <p v-if="p.bio" class="mt-5 font-semibold leading-relaxed">{{ p.bio }}</p>

          <div class="grid sm:grid-cols-2 gap-3 mt-6">
            <div class="border-2 border-tinta rounded-lg p-4 bg-amarelo">
              <p class="text-[11px] font-bold uppercase tracking-wider">Pontos</p>
              <p class="font-display text-3xl">{{ Number(p.pontos_total).toFixed(1) }}</p>
            </div>
            <div class="border-2 border-tinta rounded-lg p-4 bg-roxo">
              <p class="text-[11px] font-bold uppercase tracking-wider">Squads abertos</p>
              <p class="font-display text-3xl">{{ abertos.length }}</p>
            </div>
          </div>

          <dl class="mt-6 space-y-3">
            <div v-if="p.igreja">
              <dt class="rotulo">igreja</dt>
              <dd class="font-semibold">{{ p.igreja }}</dd>
            </div>
            <div v-if="p.ministerios">
              <dt class="rotulo">ministérios</dt>
              <dd class="font-semibold">{{ p.ministerios }}</dd>
            </div>
          </dl>

          <div v-if="redes.length" class="chumbo mt-6 pt-5">
            <span class="rotulo">redes sociais</span>
            <div class="flex flex-wrap gap-2 mt-3">
              <a
                v-for="r in redes" :key="r.nome" :href="r.url ?? '#'" target="_blank" rel="noopener"
                class="faixa bg-cartao text-sm hover:bg-amarelo"
              >{{ r.nome }}</a>
            </div>
          </div>
        </template>
      </section>

      <section v-if="!dados.restrito && conquistados.length" class="mt-6">
        <span class="rotulo text-xl">conquistas</span>
        <ul class="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
          <li v-for="s in conquistados" :key="s.codigo">
            <SeloConquista :selo="s" :imagem="imagem(s.codigo)" />
          </li>
        </ul>
      </section>

      <section v-if="!dados.restrito && abertos.length" class="mt-6">
        <span class="rotulo text-xl">squads em andamento</span>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <article v-for="s in abertos" :key="s.id" class="painel p-5">
            <div class="flex items-start justify-between gap-3">
              <span class="faixa bg-amarelo text-sm -rotate-1">{{ TIPOS_SQUAD[s.tipo]?.nome }}</span>
              <EmojiCristao v-if="s.selo_dourado" codigo="coroa" :tamanho="26" />
            </div>
            <h3 class="text-2xl mt-3">{{ s.nome }}</h3>
            <p class="font-marca text-lg text-laranja mt-1">
              {{ s.criado_por === p.id ? 'squad que ele criou' : 'squad em que foi convidado' }}
            </p>

            <div class="grid grid-cols-2 gap-2 mt-4 text-center">
              <div class="border-2 border-tinta rounded-lg py-2"
                   :class="s.selo_dourado ? 'bg-amarelo' : 'bg-cartao'">
                <p class="font-display text-3xl">{{ s.streak_atual }}</p>
                <p class="text-[10px] font-bold uppercase">
                  {{ s.selo_dourado ? 'streak com coroa' : 'de streak' }}
                </p>
              </div>
              <div class="border-2 border-tinta rounded-lg py-2 bg-cartao">
                <p class="font-display text-3xl">{{ Number(s.pontos_total ?? 0).toFixed(0) }}</p>
                <p class="text-[10px] font-bold uppercase">pontos do squad</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="!dados.restrito && encerrados.length" class="painel p-6 mt-6">
        <span class="rotulo">já encerrados</span>
        <ul class="mt-3 space-y-2">
          <li v-for="s in encerrados" :key="s.id" class="flex items-center justify-between gap-3 text-sm">
            <span class="font-bold">{{ s.nome }}</span>
            <span class="font-semibold text-fumaca">
              melhor streak <span class="font-mono text-tinta">{{ s.streak_recorde }}</span>
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
