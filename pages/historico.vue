<script setup lang="ts">
import { api, TIPOS_SQUAD, dataBR } from "~/lib/api";

const squads = ref<any[]>([]); const extrato = ref<any[]>([]); const total = ref(0);
const carregando = ref(true); const erro = ref<string | null>(null);

onMounted(async () => {
  try {
    const r: any = await api.historico();
    squads.value = r.squads ?? []; extrato.value = r.extrato ?? []; total.value = r.total ?? 0;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
});

const concluidos = computed(() => squads.value.filter(s => s.status === "concluido"));
const encerrados = computed(() => squads.value.filter(s => s.status === "cancelado"));
</script>

<template>
  <div>
    <span class="rotulo text-xl">o que já ficou pra trás</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Histórico</h1>

    <div class="painel p-6 mt-8 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <span class="rotulo">pontos conquistados</span>
        <p class="font-display text-6xl mt-1">{{ Number(total).toFixed(1) }}</p>
        <p class="font-marca text-lg text-fumaca">só de ciclos que chegaram ao fim</p>
      </div>
      <EmojiCristao codigo="coroa" :tamanho="60" />
    </div>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <template v-else>
      <section class="mt-10">
        <span class="rotulo text-xl">ciclos concluídos</span>
        <div v-if="!concluidos.length" class="painel p-6 mt-3 text-fumaca font-semibold">
          Nenhum ciclo concluído ainda.
        </div>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <article v-for="s in concluidos" :key="s.id" class="painel p-5">
            <span class="faixa bg-verde text-papel text-sm -rotate-1">{{ TIPOS_SQUAD[s.tipo]?.nome }}</span>
            <h2 class="text-2xl mt-3">{{ s.nome }}</h2>
            <p class="text-xs font-semibold text-fumaca mt-1">
              {{ dataBR(s.data_inicio) }} — {{ dataBR(s.data_fim) }}
            </p>
            <div class="grid grid-cols-3 gap-2 mt-4 text-center">
              <div class="border-2 border-tinta rounded-lg py-2 bg-amarelo">
                <p class="font-display text-2xl">{{ Number(s.pontos_total).toFixed(0) }}</p>
                <p class="text-[10px] font-bold uppercase">pontos</p>
              </div>
              <div class="border-2 border-tinta rounded-lg py-2 bg-roxo">
                <p class="font-display text-2xl">{{ s.streak_recorde }}</p>
                <p class="text-[10px] font-bold uppercase">melhor streak</p>
              </div>
              <div class="border-2 border-tinta rounded-lg py-2 bg-cartao">
                <p class="font-display text-2xl">{{ s.periodos_concluidos }}/{{ s.total_periodos }}</p>
                <p class="text-[10px] font-bold uppercase">cumpridos</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section v-if="encerrados.length" class="mt-10">
        <span class="rotulo text-xl">encerrados antes do fim</span>
        <p class="font-marca text-lg text-fumaca">estes não somaram pontos</p>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <article v-for="s in encerrados" :key="s.id" class="painel p-5 opacity-70">
            <span class="faixa bg-laranja text-papel text-sm -rotate-1">encerrado</span>
            <h2 class="text-2xl mt-3">{{ s.nome }}</h2>
            <p class="text-xs font-semibold text-fumaca mt-1">
              melhor streak: {{ s.streak_recorde }} ·
              {{ s.periodos_concluidos }} de {{ s.total_periodos }} cumpridos
            </p>
          </article>
        </div>
      </section>

      <section v-if="extrato.length" class="mt-10">
        <span class="rotulo text-xl">extrato</span>
        <div class="painel p-5 mt-3">
          <ul class="divide-y-2 divide-dashed divide-risco">
            <li v-for="l in extrato" :key="l.id" class="flex items-center justify-between gap-4 py-3">
              <div>
                <p class="font-bold">{{ l.squads?.nome }}</p>
                <p class="text-xs text-fumaca font-semibold">{{ l.motivo }} · {{ dataBR(l.created_at) }}</p>
              </div>
              <span class="font-display text-2xl">+{{ Number(l.pontos).toFixed(1) }}</span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>
