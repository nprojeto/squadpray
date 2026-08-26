<script setup lang="ts">
import { dataBR, type Periodo } from "~/lib/api";

const props = defineProps<{
  periodos: Periodo[]; streak: number; recorde: number;
  selo: boolean; semanal: boolean; pontos: number; meuId?: string;
  meuStreak?: number; meusDias?: number;
}>();

const cumpridos = computed(() => props.periodos.filter((p) => p.status === "concluido").length);

const hoje = new Date().toLocaleDateString("sv-SE");

function estado(p: Periodo) {
  if (p.status === "concluido") return "feito";
  if (p.status === "falhou") return "perdido";
  if (p.data_fim < hoje) return "perdido";
  if (props.meuId && p.autor_id === props.meuId) return "minhaVez";
  return "espera";
}

const ehHoje = (p: Periodo) => p.data_inicio <= hoje && hoje <= p.data_fim;

const minhasDatas = computed(() =>
  props.periodos.filter((p) => props.meuId && p.autor_id === props.meuId && p.data_fim >= hoje));

const faltamPraCoroa = computed(() => Math.max(0, 7 - props.streak));
</script>

<template>
  <section class="painel p-6 sm:p-8">
    <div class="flex items-start justify-between gap-6 flex-wrap">
      <div>
        <span class="rotulo">streak do squad</span>
        <div class="flex items-baseline gap-3 mt-1">
          <span class="font-display leading-none text-7xl sm:text-8xl">{{ streak }}</span>
          <span class="font-display text-2xl text-fumaca uppercase">
            {{ semanal ? (streak === 1 ? 'semana' : 'semanas') : (streak === 1 ? 'dia' : 'dias') }}
          </span>
        </div>
        <div class="flex flex-wrap gap-2 mt-4">
          <span class="faixa bg-roxo text-tinta text-sm">recorde {{ recorde }}</span>
          <span class="faixa bg-verde text-papel text-sm">{{ Number(pontos).toFixed(1) }} pts</span>
          <span class="faixa bg-amarelo text-sm">
            {{ cumpridos }}/{{ periodos.length }} {{ semanal ? 'encontros' : 'dias' }}
          </span>
          <span v-if="meuStreak" class="faixa bg-cartao text-sm">seu streak {{ meuStreak }}</span>
          <span v-if="meusDias" class="faixa bg-cartao text-sm">você cumpriu {{ meusDias }}</span>
        </div>
      </div>

      <div class="text-center shrink-0">
        <div
          class="w-24 h-24 grid place-items-center border-2 border-tinta rounded-xl -rotate-3"
          :class="selo ? 'bg-amarelo shadow-bloco animate-carimbo' : 'bg-papel border-dashed opacity-45'"
        >
          <EmojiCristao codigo="coroa" :tamanho="46" />
        </div>
        <p class="font-marca text-lg mt-2" :class="selo ? 'text-laranja' : 'text-fumaca'">
          {{ selo ? 'coroa conquistada!' : `faltam ${faltamPraCoroa} p/ a coroa` }}
        </p>
      </div>
    </div>

    <div class="mt-7 chumbo pt-6">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="rotulo">{{ semanal ? 'semanas do ciclo' : 'dias do ciclo' }}</span>
        <span v-if="minhasDatas.length" class="font-marca text-lg text-roxo">
          você escreve em {{ minhasDatas.map(d => dataBR(d.data_inicio).slice(0, 5)).slice(0, 4).join(', ') }}<template v-if="minhasDatas.length > 4">…</template>
        </span>
      </div>
      <div class="grid gap-1.5 mt-3" :class="semanal ? 'grid-cols-6 sm:grid-cols-10' : 'grid-cols-7 sm:grid-cols-14'">
        <div
          v-for="p in periodos" :key="p.id"
          class="group relative aspect-square rounded-md border-2 border-tinta transition-all"
          :class="[
            {
              'bg-amarelo shadow-blocoP animate-colar': estado(p) === 'feito',
              'bg-laranja/25 border-dashed': estado(p) === 'perdido',
              'bg-roxo shadow-blocoP': estado(p) === 'minhaVez',
              'bg-papel border-risco': estado(p) === 'espera',
            },
            ehHoje(p) ? 'ring-2 ring-offset-2 ring-tinta ring-offset-cartao' : '',
          ]"
        >
          <span
            class="absolute inset-0 grid place-items-center font-mono text-[10px] font-bold"
            :class="estado(p) === 'espera' ? 'text-fumaca' : 'text-tinta'"
          >{{ p.indice }}</span>

          <span
            class="pointer-events-none absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden
                   group-hover:block whitespace-nowrap rounded-md bg-tinta text-papel
                   px-2.5 py-1.5 text-[11px]"
          >
            {{ dataBR(p.data_inicio) }}<template v-if="semanal"> a {{ dataBR(p.data_fim) }}</template>
            <template v-if="p.profiles?.nome"> · {{ p.profiles.nome }}</template>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs font-semibold">
        <span class="flex items-center gap-1.5"><i class="w-3.5 h-3.5 rounded-sm bg-amarelo border-2 border-tinta inline-block" /> cumprido</span>
        <span class="flex items-center gap-1.5"><i class="w-3.5 h-3.5 rounded-sm bg-roxo border-2 border-tinta inline-block" /> minha vez</span>
        <span class="flex items-center gap-1.5"><i class="w-3.5 h-3.5 rounded-sm bg-papel border-2 border-tinta ring-2 ring-tinta ring-offset-1 ring-offset-cartao inline-block" /> hoje</span>
        <span class="flex items-center gap-1.5"><i class="w-3.5 h-3.5 rounded-sm bg-laranja/25 border-2 border-dashed border-tinta inline-block" /> perdido</span>
        <span class="flex items-center gap-1.5"><i class="w-3.5 h-3.5 rounded-sm bg-papel border-2 border-risco inline-block" /> a vir</span>
      </div>
    </div>
  </section>
</template>
