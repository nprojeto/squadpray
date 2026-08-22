<script setup lang="ts">
const props = defineProps<{
  emojis: { codigo: string; nome: string; descricao?: string }[];
  reacoes: { emoji: string; user_id: string; profiles?: { nome: string } }[];
  meuId: string;
  souAutor: boolean;
  enviando?: boolean;
}>();
const emit = defineEmits<{ reagir: [codigo: string] }>();

const minhaReacao = computed(() => props.reacoes.find((r) => r.user_id === props.meuId)?.emoji);
const contagem = computed(() => {
  const m: Record<string, string[]> = {};
  for (const r of props.reacoes) {
    (m[r.emoji] ||= []).push(r.profiles?.nome ?? "alguém");
  }
  return m;
});
</script>

<template>
  <div>
    <p v-if="!souAutor && !minhaReacao" class="rotulo mb-2.5">Reaja para marcar que leu</p>
    <p v-else-if="souAutor" class="rotulo mb-2.5">Reações do seu squad</p>
    <p v-else class="rotulo mb-2.5">Você já marcou que leu</p>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="e in emojis" :key="e.codigo"
        type="button"
        :disabled="souAutor || !!minhaReacao || enviando"
        :title="e.descricao || e.nome"
        class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition
               disabled:cursor-default"
        :class="minhaReacao === e.codigo
          ? 'border-ouro bg-ouro/12'
          : (contagem[e.codigo]?.length
              ? 'border-lilas/40 bg-lilas/8'
              : 'border-borda bg-noite/40 enabled:hover:border-lilas enabled:hover:bg-lilas/12')"
        @click="emit('reagir', e.codigo)"
      >
        <EmojiCristao :codigo="e.codigo" :tamanho="24" />
        <span class="text-xs text-sussurro group-hover:text-texto">{{ e.nome }}</span>
        <span v-if="contagem[e.codigo]?.length" class="font-mono text-xs text-ouro">
          {{ contagem[e.codigo].length }}
        </span>
      </button>
    </div>

    <p v-if="reacoes.length" class="text-xs text-sussurro mt-3">
      Leram: {{ reacoes.map(r => r.profiles?.nome ?? 'alguém').join(', ') }}
    </p>
  </div>
</template>
