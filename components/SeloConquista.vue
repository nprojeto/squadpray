<script setup lang="ts">
const props = defineProps<{ selo: any; imagem: string }>();
const virado = ref(false);

const cores: Record<string, string> = {
  vermelha: "bg-laranja text-papel",
  verde: "bg-verde text-papel",
  roxa: "bg-roxo text-tinta",
  laranja: "bg-amarelo text-tinta",
  azul: "bg-[#1B3A6B] text-papel",
};
const cor = computed(() => cores[props.selo.classe] ?? "bg-cartao text-tinta");
</script>

<template>
  <div class="[perspective:1000px] h-full">
    <button
      type="button"
      class="relative w-full h-full min-h-[15rem] sm:min-h-[17rem] text-left
             [transform-style:preserve-3d] transition-transform duration-500"
      :style="virado ? 'transform: rotateY(180deg)' : ''"
      :aria-label="virado ? `Ver ${selo.titulo}` : `Ver a regra de ${selo.titulo}`"
      @click="virado = !virado"
    >
      <!-- frente -->
      <span
        class="absolute inset-0 [backface-visibility:hidden] painel p-2 sm:p-3
               flex flex-col items-center overflow-hidden"
      >
        <span class="w-full flex-1 min-h-0 grid place-items-center">
          <img
            :src="imagem" :alt="selo.titulo"
            class="max-w-full max-h-full object-contain"
            :style="selo.conquistado ? '' : 'filter: brightness(.62) saturate(.85); opacity:.6;'"
          />
        </span>

        <span class="w-full shrink-0 mt-1.5">
          <span class="flex items-center justify-center gap-0.5">
            <svg v-for="i in selo.estrelas" :key="i" width="11" height="11" viewBox="0 0 24 24"
                 :fill="selo.conquistado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                 :class="selo.conquistado ? 'text-amarelo' : 'text-fumaca'">
              <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
            </svg>
          </span>

          <span
            class="block text-[9px] sm:text-[10px] font-bold uppercase text-center mt-1
                   rounded px-1 py-1 border-2 border-tinta leading-tight break-words"
            :class="selo.conquistado ? cor : 'bg-cartao text-fumaca opacity-70'"
          >{{ selo.titulo }}</span>

          <span
            class="block text-[10px] font-semibold text-center mt-1 leading-tight break-words line-clamp-3"
            :class="selo.conquistado ? '' : 'text-fumaca'"
          >{{ selo.sub || selo.frase }}</span>
        </span>
      </span>

      <!-- verso -->
      <span
        class="absolute inset-0 [backface-visibility:hidden] painel p-3 flex flex-col
               justify-center text-center overflow-hidden"
        style="transform: rotateY(180deg)"
      >
        <span class="rotulo text-base">como conquistar</span>
        <span class="block font-bold text-[11px] sm:text-xs mt-2 leading-snug break-words">
          {{ selo.regra }}
        </span>

        <span class="block font-marca text-base mt-3"
              :class="selo.conquistado ? 'text-verde' : 'text-fumaca'">
          {{ selo.conquistado ? 'conquistado!' : 'ainda não' }}
        </span>

        <span class="flex items-center justify-center gap-0.5 mt-2">
          <svg v-for="i in selo.estrelas" :key="i" width="11" height="11" viewBox="0 0 24 24"
               fill="currentColor" class="text-amarelo">
            <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
          </svg>
        </span>
      </span>
    </button>
  </div>
</template>
