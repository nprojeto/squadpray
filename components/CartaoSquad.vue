<script setup lang="ts">
import { TIPOS_SQUAD, dataBR, ehSemanal, type Squad } from "~/lib/api";
defineProps<{ squad: Squad }>();
</script>

<template>
  <NuxtLink
    :to="`/squad/${squad.id}`"
    class="painel p-5 block transition hover:border-lilas/50 hover:-translate-y-0.5"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="rotulo">{{ TIPOS_SQUAD[squad.tipo].nome }}</p>
        <h3 class="text-xl mt-1 truncate">{{ squad.nome }}</h3>
      </div>
      <EmojiCristao v-if="squad.selo_dourado" codigo="coroa" :tamanho="26" />
    </div>

    <div class="flex items-end justify-between mt-5">
      <div>
        <span class="font-mono text-3xl font-extrabold" :class="squad.selo_dourado ? 'text-ouro' : 'text-texto'">
          {{ squad.streak_atual }}
        </span>
        <span class="text-sussurro text-sm ml-1.5">
          {{ ehSemanal(squad.tipo) ? 'sem.' : 'dias' }}
        </span>
      </div>
      <div class="text-right text-xs text-sussurro">
        <p>{{ squad.qtd_membros }} de 6 pessoas</p>
        <p class="font-mono">{{ Number(squad.pontos_total).toFixed(1) }} pts</p>
      </div>
    </div>

    <div class="chumbo mt-4 pt-3 flex items-center justify-between text-xs text-sussurro">
      <span>{{ dataBR(squad.data_inicio) }} — {{ dataBR(squad.data_fim) }}</span>
      <span
        class="px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider"
        :class="squad.status === 'ativo'
          ? 'border-esmeralda/50 text-esmeralda'
          : squad.status === 'rascunho' ? 'border-ouro/50 text-ouro' : 'border-borda'"
      >{{ squad.status === 'rascunho' ? 'montando' : squad.status }}</span>
    </div>
  </NuxtLink>
</template>
