<script setup lang="ts">
const props = withDefaults(defineProps<{ codigo: string; tamanho?: number }>(), { tamanho: 28 });

const paleta: Record<string, string> = {
  amem: "#F04E23", oracao: "#B07BE8", cruz: "#151310", pomba: "#1D6B62",
  fogo: "#F04E23", luz: "#F5CE16", coroa: "#F5CE16", semente: "#1D6B62",
};
const cor = computed(() => paleta[props.codigo] ?? "#151310");
</script>

<template>
  <svg :width="tamanho" :height="tamanho" viewBox="0 0 32 32" fill="none"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="text-tinta">
    <g v-if="codigo === 'amem'" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.6 17.6v-4.2a1.6 1.6 0 1 1 3.2 0v6.9c0 4-2.9 6.8-6.9 6.8-3.6 0-5.4-1.5-7-4.3l-2.2-3.9a1.7 1.7 0 0 1 2.7-2l2 2.2V9.5a1.6 1.6 0 1 1 3.2 0V8a1.6 1.6 0 1 1 3.2 0v2a1.6 1.6 0 1 1 3.2 0z" :fill="cor" />
      <path d="M16 5.6V3M11.4 6.6 10 4.8M20.6 6.6 22 4.8" />
    </g>

    <g v-else-if="codigo === 'oracao'" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4.5c-1.4 2.6-3.6 5-5.9 6.9-1.6 1.3-2.4 2.7-2.4 4.5 0 2.4 1.3 4.2 3.4 5.3l4.9 2.6" :fill="cor" />
      <path d="M16 4.5c1.4 2.6 3.6 5 5.9 6.9 1.6 1.3 2.4 2.7 2.4 4.5 0 2.4-1.3 4.2-3.4 5.3L16 23.8" :fill="cor" />
      <path d="M10.5 26.5h11" />
    </g>

    <path v-else-if="codigo === 'cruz'" d="M13.4 4.4h5.2v7.2H26v5.2h-7.4v11h-5.2v-11H6v-5.2h7.4z"
          :fill="cor" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />

    <g v-else-if="codigo === 'pomba'" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26.5 9.5c-2.6-.6-4.4.3-6 2.1-2 2.3-3.2 5.4-6.4 6.6-3.4 1.3-6.6-.4-8.3-2.6" :fill="cor" />
      <path d="M5.8 15.6c-.4 4.6 2.8 8.6 7.4 9.3 4.9.7 8.9-2.3 10-6.6" :fill="cor" />
      <path d="M23.2 18.3c2.4-1.6 3.6-4.3 3.3-7" />
      <circle cx="24.4" cy="10.9" r=".9" fill="currentColor" stroke="none" />
    </g>

    <g v-else-if="codigo === 'fogo'">
      <path d="M16 3.5c.8 4.2-1.3 5.8-3.4 7.7-2.5 2.2-4.6 4.4-4.6 8.2 0 5 3.8 8.3 8 8.3s8-3.3 8-8.3c0-3.6-1.6-5.5-3.4-7.6-.8 1.3-1.7 2-2.7 2.1.7-3.9-.3-7.6-1.9-10.4z"
            :fill="cor" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
      <path d="M16 27.7c-2.4 0-4.1-1.7-4.1-4 0-2.6 2.3-3.6 3.1-6 1.6 1.6 5.1 3.3 5.1 6 0 2.3-1.7 4-4.1 4z"
            fill="#F5CE16" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
    </g>

    <g v-else-if="codigo === 'luz'" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="15" r="5.5" :fill="cor" />
      <path d="M16 3.5v3.2M16 23.3v3.2M4.6 15h3.2M24.2 15h3.2M8 7l2.3 2.3M21.7 20.7 24 23M24 7l-2.3 2.3M10.3 20.7 8 23" />
    </g>

    <g v-else-if="codigo === 'coroa'">
      <path d="M5 10.5l4.6 4.2L16 6.5l6.4 8.2L27 10.5l-2.2 13.2H7.2z"
            :fill="cor" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
      <path d="M7.2 26.5h17.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
      <circle cx="16" cy="18.5" r="1.6" fill="currentColor" />
    </g>

    <g v-else-if="codigo === 'semente'" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 27V13" />
      <path d="M16 15.5c-5 0-8-3-8-7.5 4.6 0 8 2.6 8 7.5z" :fill="cor" />
      <path d="M16 18.5c5 0 8-3 8-7.5-4.6 0-8 2.6-8 7.5z" :fill="cor" />
      <path d="M11 27h10" />
    </g>

    <circle v-else cx="16" cy="16" r="10" stroke="currentColor" stroke-width="1.9" />
  </svg>
</template>
