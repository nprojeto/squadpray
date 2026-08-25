<script setup lang="ts">
import { api, dataBR } from "~/lib/api";

const selos = ref<any[]>([]);
const carregando = ref(true);
const erro = ref<string | null>(null);
const aba = ref<"todas" | "minhas" | "faltam">("todas");
const base = useRuntimeConfig().app.baseURL;

onMounted(async () => {
  try {
    const r: any = await api.conquistas();
    selos.value = r.selos ?? [];
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
});

const conquistados = computed(() => selos.value.filter((s) => s.conquistado));
const lista = computed(() =>
  aba.value === "minhas" ? conquistados.value
  : aba.value === "faltam" ? selos.value.filter((s) => !s.conquistado)
  : selos.value);

const progresso = computed(() =>
  selos.value.length ? Math.round((conquistados.value.length / selos.value.length) * 100) : 0);

const imagem = (codigo: string) => `${base.replace(/\/$/, "")}/selos/${codigo}.png`;
</script>

<template>
  <div>
    <span class="rotulo text-xl">o que vocês já ergueram juntos</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Minhas conquistas</h1>

    <section class="painel p-6 mt-8">
      <div class="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span class="rotulo">selos conquistados</span>
          <p class="font-display text-5xl mt-1">
            {{ conquistados.length }}<span class="text-fumaca text-3xl">/{{ selos.length }}</span>
          </p>
        </div>
        <p class="font-marca text-xl text-laranja">
          {{ progresso === 100 ? 'coleção completa!' : `${progresso}% da coleção` }}
        </p>
      </div>
      <div class="h-4 border-2 border-tinta rounded-full bg-papel overflow-hidden mt-4">
        <div class="h-full bg-amarelo border-r-2 border-tinta transition-all"
             :style="{ width: progresso + '%' }" />
      </div>
    </section>

    <AvisoErro :mensagem="erro" class="mt-6" />

    <nav class="grid grid-cols-3 gap-2 mt-6">
      <button
        v-for="a in [
          { k: 'todas', t: 'Todas', n: selos.length },
          { k: 'minhas', t: 'Conquistadas', n: conquistados.length },
          { k: 'faltam', t: 'A conquistar', n: selos.length - conquistados.length },
        ]" :key="a.k"
        class="rounded-lg border-2 border-tinta px-2 py-2.5 font-display uppercase text-sm sm:text-lg transition"
        :class="aba === a.k ? 'bg-amarelo shadow-blocoP' : 'bg-cartao text-fumaca hover:bg-amarelo/40'"
        @click="aba = a.k as any"
      >
        {{ a.t }} <span class="font-mono text-xs">{{ a.n }}</span>
      </button>
    </nav>

    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <p v-else-if="!lista.length" class="painel p-8 mt-6 text-center font-semibold">
      {{ aba === 'minhas' ? 'Você ainda não conquistou nenhum selo. Bora começar?' : 'Nada por aqui.' }}
    </p>

    <ul v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
      <li v-for="s in lista" :key="s.codigo" class="painel p-4 text-center flex flex-col">
        <div class="relative mx-auto w-full max-w-[170px] aspect-square">
          <!-- conquistado -->
          <img
            v-if="s.conquistado" :src="imagem(s.codigo)" :alt="s.titulo"
            class="w-full h-full object-contain animate-colar"
          />

          <!-- bloqueado: só a silhueta -->
          <div v-else class="w-full h-full relative">
            <img
              :src="imagem(s.codigo)" alt=""
              class="w-full h-full object-contain opacity-100"
              style="filter: grayscale(1) brightness(0) opacity(.12);"
            />
            <span class="absolute inset-0 grid place-items-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.2" class="text-fumaca">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
          </div>
        </div>

        <template v-if="s.conquistado">
          <h2 class="font-display text-lg uppercase mt-3 leading-tight">{{ s.titulo }}</h2>
          <p class="text-xs font-semibold mt-1.5">{{ s.frase }}</p>
          <p v-if="s.conquistado_em" class="font-marca text-base text-laranja mt-2">
            em {{ dataBR(s.conquistado_em) }}
          </p>
        </template>

        <template v-else>
          <h2 class="font-display text-lg uppercase mt-3 leading-tight text-fumaca">? ? ?</h2>
          <p class="text-xs font-bold mt-2 border-2 border-dashed border-risco rounded-lg px-2 py-2">
            {{ s.regra }}
          </p>
        </template>
      </li>
    </ul>
  </div>
</template>
