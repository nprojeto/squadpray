<script setup lang="ts">
import { EMOJI_REACAO } from "~/lib/api";

const props = defineProps<{
  emojis: { codigo: string; nome: string; descricao?: string }[];
  reacoes: { emoji: string; user_id: string; profiles?: { nome: string } }[];
  meuId: string; souAutor: boolean; enviando?: boolean;
}>();
const emit = defineEmits<{ reagir: [codigo: string] }>();

const minhaReacao = computed(() => props.reacoes.find((r) => r.user_id === props.meuId)?.emoji);
const contagem = computed(() => {
  const m: Record<string, string[]> = {};
  for (const r of props.reacoes) (m[r.emoji] ||= []).push(r.profiles?.nome ?? "alguém");
  return m;
});
</script>

<template>
  <div>
    <span class="rotulo">
      {{ souAutor ? 'reações do seu squad' : (minhaReacao ? 'você marcou que leu' : 'reaja para marcar que leu') }}
    </span>

    <div class="flex flex-wrap gap-2 mt-3">
      <button
        v-for="e in emojis" :key="e.codigo" type="button"
        :disabled="souAutor || !!minhaReacao || enviando"
        :title="e.descricao || e.nome"
        class="flex items-center gap-2 rounded-lg border-2 border-tinta px-3 py-2 transition
               disabled:cursor-default"
        :class="minhaReacao === e.codigo
          ? 'bg-amarelo shadow-blocoP'
          : (contagem[e.codigo]?.length ? 'bg-roxo/45' : 'bg-cartao enabled:hover:bg-amarelo enabled:hover:shadow-blocoP')"
        @click="emit('reagir', e.codigo)"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ EMOJI_REACAO[e.codigo] ?? "✨" }}</span>
        <span class="text-xs font-bold uppercase">{{ e.nome }}</span>
        <span v-if="contagem[e.codigo]?.length" class="font-mono text-xs font-bold">
          {{ contagem[e.codigo].length }}
        </span>
      </button>
    </div>

    <p v-if="reacoes.length" class="font-marca text-lg text-fumaca mt-3">
      leram: {{ reacoes.map(r => r.profiles?.nome ?? 'alguém').join(', ') }}
    </p>
  </div>
</template>
