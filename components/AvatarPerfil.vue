<script setup lang="ts">
const props = withDefaults(defineProps<{
  url?: string | null; nome?: string; tamanho?: number;
  selo?: boolean; streak?: number;
}>(), { tamanho: 40, selo: false, streak: 0 });

const iniciais = computed(() =>
  (props.nome ?? "?").trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("").toUpperCase());
const marca = computed(() => Math.max(16, Math.round(props.tamanho * 0.42)));
const lado = computed(() => `${props.tamanho}px`);
</script>

<template>
  <span
    class="relative block shrink-0"
    :style="{ width: lado, height: lado, minWidth: lado, minHeight: lado, flex: `0 0 ${lado}` }"
  >
    <span class="absolute inset-0 rounded-full overflow-hidden border-2 border-tinta bg-amarelo">
      <FotoSegura
        v-if="url" :src="url" :alt="nome ? `Foto de ${nome}` : 'Foto de perfil'"
        classe="block w-full h-full object-cover"
      />
      <span
        v-else
        class="flex w-full h-full items-center justify-center font-display uppercase leading-none"
        :style="{ fontSize: Math.round(tamanho * 0.38) + 'px' }"
      >{{ iniciais }}</span>
    </span>

    <span
      v-if="selo"
      class="absolute -bottom-1 -right-1 rounded-full bg-amarelo border-2 border-tinta grid place-items-center"
      :style="{ width: marca + 'px', height: marca + 'px' }"
      :title="streak ? `${streak} dias de streak` : 'Squad com selo dourado'"
    >
      <EmojiCristao codigo="coroa" :tamanho="Math.round(marca * 0.62)" />
    </span>
  </span>
</template>
