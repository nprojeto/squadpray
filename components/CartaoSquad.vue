<script setup lang="ts">
import { TIPOS_SQUAD, ICONE_TIPO, dataBR, ehSemanal, type Squad } from "~/lib/api";
const props = defineProps<{ squad: Squad }>();

const cores: Record<string, string> = {
  leitura_biblica: "bg-amarelo", livros: "bg-roxo", devocional: "bg-verde text-papel",
  oracao: "bg-laranja text-papel", jejum: "bg-rosa text-papel",
  celebracao: "bg-amarelo", gdc: "bg-roxo",
};
const cor = computed(() => cores[props.squad.tipo] ?? "bg-amarelo");
</script>

<template>
  <NuxtLink
    :to="`/squad/${squad.id}`"
    class="painel p-5 block transition hover:-translate-y-1 hover:shadow-[7px_7px_0_#151310]"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="flex items-center gap-2">
        <EmojiCristao :codigo="ICONE_TIPO[squad.tipo]" :tamanho="34" />
        <span class="faixa text-sm -rotate-1" :class="cor">{{ TIPOS_SQUAD[squad.tipo].nome }}</span>
      </span>
      <EmojiCristao v-if="squad.selo_dourado" codigo="coroa" :tamanho="30" />
    </div>

    <h3 class="text-2xl mt-4 break-words">{{ squad.nome }}</h3>

    <div class="flex items-end justify-between mt-4">
      <div class="flex items-baseline gap-1.5">
        <span class="font-display text-5xl leading-none">{{ squad.streak_atual }}</span>
        <span class="font-marca text-xl text-laranja">
          {{ ehSemanal(squad.tipo) ? 'sem.' : 'dias' }}
        </span>
      </div>
      <div class="text-right text-xs font-semibold text-fumaca">
        <p>{{ squad.qtd_membros }}/6 pessoas</p>
        <p class="font-mono text-tinta">{{ Number(squad.pontos_total).toFixed(1) }} pts</p>
      </div>
    </div>

    <div class="chumbo mt-4 pt-3 flex items-center justify-between text-xs font-semibold">
      <span class="text-fumaca">{{ dataBR(squad.data_inicio) }} — {{ dataBR(squad.data_fim) }}</span>
      <span
        class="px-2 py-0.5 rounded-full border-2 border-tinta text-[10px] uppercase"
        :class="squad.status === 'ativo' ? 'bg-verde text-papel'
              : squad.status === 'rascunho' ? 'bg-amarelo' : 'bg-papel text-fumaca'"
      >{{ squad.status === 'rascunho' ? 'montando' : squad.status }}</span>
    </div>
  </NuxtLink>
</template>
