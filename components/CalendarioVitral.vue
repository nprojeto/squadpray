<script setup lang="ts">
import { dataBR, type Periodo } from "~/lib/api";

const props = defineProps<{
  periodos: Periodo[];
  streak: number;
  recorde: number;
  selo: boolean;
  semanal: boolean;
  pontos: number;
}>();

const hoje = new Date().toISOString().slice(0, 10);

function estado(p: Periodo) {
  if (p.status === "concluido") return "aceso";
  if (p.status === "falhou") return "apagado";
  if (p.data_inicio <= hoje && hoje <= p.data_fim) return "agora";
  if (p.data_fim < hoje) return "apagado";
  return "espera";
}

const faltamPraCoroa = computed(() => Math.max(0, 7 - props.streak));
</script>

<template>
  <section class="painel p-6 sm:p-8 relative overflow-hidden">
    <!-- selo dourado -->
    <div
      v-if="selo"
      class="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-2xl bg-ouro/25 pointer-events-none"
    />

    <div class="flex items-start justify-between gap-6 relative">
      <div>
        <p class="rotulo">Streak do squad</p>
        <div class="flex items-baseline gap-3 mt-2">
          <span
            class="font-mono font-extrabold leading-none text-6xl sm:text-7xl tabular-nums"
            :class="selo ? 'text-ouro' : 'text-texto'"
          >{{ streak }}</span>
          <span class="text-sussurro text-lg">{{ semanal ? (streak === 1 ? 'semana' : 'semanas') : (streak === 1 ? 'dia' : 'dias') }}</span>
        </div>
        <p class="text-sm text-sussurro mt-2">
          Recorde: <span class="font-mono text-texto">{{ recorde }}</span>
          · Pontos: <span class="font-mono text-texto">{{ Number(pontos).toFixed(1) }}</span>
        </p>
      </div>

      <div class="text-center shrink-0">
        <div
          class="w-20 h-20 rounded-2xl grid place-items-center border transition"
          :class="selo
            ? 'border-ouro/70 bg-ouro/10 shadow-ouro animate-pulsoOuro'
            : 'border-borda bg-noite/40'"
        >
          <EmojiCristao codigo="coroa" :tamanho="40" :class="selo ? '' : 'opacity-20 grayscale'" />
        </div>
        <p class="text-[11px] mt-2" :class="selo ? 'text-ouro' : 'text-sussurro'">
          {{ selo ? 'Selo conquistado' : `Faltam ${faltamPraCoroa}` }}
        </p>
      </div>
    </div>

    <!-- painéis de vitral -->
    <div class="mt-7 chumbo pt-6">
      <p class="rotulo mb-3">{{ semanal ? 'Semanas do ciclo' : 'Dias do ciclo' }}</p>
      <div class="grid gap-1.5" :class="semanal ? 'grid-cols-6 sm:grid-cols-10' : 'grid-cols-7 sm:grid-cols-14'">
        <div
          v-for="p in periodos" :key="p.id"
          class="group relative aspect-square rounded-md border transition-all duration-300"
          :class="{
            'bg-ouro/85 border-ouro shadow-ouro animate-acender': estado(p) === 'aceso',
            'bg-rubi/25 border-rubi/50': estado(p) === 'apagado',
            'bg-lilas/25 border-lilas ring-2 ring-lilas/40': estado(p) === 'agora',
            'bg-noite/50 border-borda': estado(p) === 'espera',
          }"
        >
          <span
            class="absolute inset-0 grid place-items-center font-mono text-[10px]"
            :class="estado(p) === 'aceso' ? 'text-noite font-extrabold' : 'text-sussurro/70'"
          >{{ p.indice }}</span>

          <span
            class="pointer-events-none absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden
                   group-hover:block whitespace-nowrap rounded-lg bg-noite border border-borda
                   px-2.5 py-1.5 text-[11px] text-texto shadow-vitral"
          >
            {{ dataBR(p.data_inicio) }}<template v-if="semanal"> a {{ dataBR(p.data_fim) }}</template>
            <template v-if="p.profiles?.nome"> · {{ p.profiles.nome }}</template>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-[11px] text-sussurro">
        <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-ouro/85 inline-block" /> cumprido</span>
        <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-lilas/40 inline-block" /> em aberto</span>
        <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-rubi/30 inline-block" /> perdido</span>
        <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-noite border border-borda inline-block" /> a vir</span>
      </div>
    </div>
  </section>
</template>
