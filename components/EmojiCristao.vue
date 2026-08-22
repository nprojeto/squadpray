<script setup lang="ts">
const props = withDefaults(defineProps<{ codigo: string; tamanho?: number }>(), { tamanho: 28 });

const paleta: Record<string, string> = {
  amem: "#E9B949",
  oracao: "#8E7BE8",
  cruz: "#EAE6F7",
  pomba: "#7FD8E8",
  fogo: "#C2415C",
  luz: "#F2D98B",
  coroa: "#E9B949",
  semente: "#2FA98C",
};
const cor = computed(() => paleta[props.codigo] ?? "#EAE6F7");
</script>

<template>
  <svg
    :width="tamanho" :height="tamanho" viewBox="0 0 32 32"
    fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
  >
    <!-- Amém: mão aberta recebendo -->
    <g v-if="codigo === 'amem'" :stroke="cor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20V9.5a1.6 1.6 0 1 1 3.2 0V17" />
      <path d="M14.2 16.4V8a1.6 1.6 0 1 1 3.2 0v8.4" />
      <path d="M17.4 16.8V10a1.6 1.6 0 1 1 3.2 0v7.6" />
      <path d="M20.6 17.6v-4.2a1.6 1.6 0 1 1 3.2 0v6.9c0 4-2.9 6.8-6.9 6.8-3.6 0-5.4-1.5-7-4.3l-2.2-3.9a1.7 1.7 0 0 1 2.7-2l2 2.2" />
      <path d="M16 5.6V3M11.4 6.6 10 4.8M20.6 6.6 22 4.8" opacity=".55" />
    </g>

    <!-- Orando: mãos em oração -->
    <g v-else-if="codigo === 'oracao'" :stroke="cor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 4.5c-1.4 2.6-3.6 5-5.9 6.9-1.6 1.3-2.4 2.7-2.4 4.5 0 2.4 1.3 4.2 3.4 5.3l4.9 2.6" />
      <path d="M16 4.5c1.4 2.6 3.6 5 5.9 6.9 1.6 1.3 2.4 2.7 2.4 4.5 0 2.4-1.3 4.2-3.4 5.3L16 23.8" />
      <path d="M16 4.5v19.3" opacity=".5" />
      <path d="M10.5 26.5h11" opacity=".7" />
    </g>

    <!-- Cruz -->
    <g v-else-if="codigo === 'cruz'">
      <path d="M13.4 4.4h5.2v7.2H26v5.2h-7.4v11h-5.2v-11H6v-5.2h7.4z"
            :fill="cor" fill-opacity=".16" :stroke="cor" stroke-width="1.7" stroke-linejoin="round" />
    </g>

    <!-- Pomba -->
    <g v-else-if="codigo === 'pomba'" :stroke="cor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26.5 9.5c-2.6-.6-4.4.3-6 2.1-2 2.3-3.2 5.4-6.4 6.6-3.4 1.3-6.6-.4-8.3-2.6" :fill="cor" fill-opacity=".12" />
      <path d="M5.8 15.6c-.4 4.6 2.8 8.6 7.4 9.3 4.9.7 8.9-2.3 10-6.6" />
      <path d="M23.2 18.3c2.4-1.6 3.6-4.3 3.3-7" />
      <circle cx="24.4" cy="10.9" r=".9" :fill="cor" stroke="none" />
    </g>

    <!-- Fogo -->
    <g v-else-if="codigo === 'fogo'">
      <path d="M16 3.5c.8 4.2-1.3 5.8-3.4 7.7-2.5 2.2-4.6 4.4-4.6 8.2 0 5 3.8 8.3 8 8.3s8-3.3 8-8.3c0-3.6-1.6-5.5-3.4-7.6-.8 1.3-1.7 2-2.7 2.1.7-3.9-.3-7.6-1.9-10.4z"
            :fill="cor" fill-opacity=".18" :stroke="cor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M16 27.7c-2.4 0-4.1-1.7-4.1-4 0-2.6 2.3-3.6 3.1-6 1.6 1.6 5.1 3.3 5.1 6 0 2.3-1.7 4-4.1 4z"
            :fill="cor" fill-opacity=".45" stroke="none" />
    </g>

    <!-- Luz: candeia -->
    <g v-else-if="codigo === 'luz'" :stroke="cor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="15" r="5.5" :fill="cor" fill-opacity=".2" />
      <path d="M16 3.5v3.2M16 23.3v3.2M4.6 15h3.2M24.2 15h3.2M8 7l2.3 2.3M21.7 20.7 24 23M24 7l-2.3 2.3M10.3 20.7 8 23" />
    </g>

    <!-- Coroa -->
    <g v-else-if="codigo === 'coroa'">
      <path d="M5 10.5l4.6 4.2L16 6.5l6.4 8.2L27 10.5l-2.2 13.2H7.2z"
            :fill="cor" fill-opacity=".2" :stroke="cor" stroke-width="1.7" stroke-linejoin="round" />
      <path d="M7.2 26.5h17.6" :stroke="cor" stroke-width="1.7" stroke-linecap="round" />
      <circle cx="16" cy="18.5" r="1.6" :fill="cor" />
    </g>

    <!-- Semente -->
    <g v-else-if="codigo === 'semente'" :stroke="cor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 27V13" />
      <path d="M16 15.5c-5 0-8-3-8-7.5 4.6 0 8 2.6 8 7.5z" :fill="cor" fill-opacity=".18" />
      <path d="M16 18.5c5 0 8-3 8-7.5-4.6 0-8 2.6-8 7.5z" :fill="cor" fill-opacity=".28" />
      <path d="M11 27h10" />
    </g>

    <!-- fallback -->
    <circle v-else cx="16" cy="16" r="10" :stroke="cor" stroke-width="1.7" />
  </svg>
</template>
