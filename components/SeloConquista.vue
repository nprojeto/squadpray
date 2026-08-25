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
  <div class="[perspective:1000px]">
    <button
      type="button"
      class="relative w-full aspect-[3/4] text-left [transform-style:preserve-3d] transition-transform duration-500"
      :style="virado ? 'transform: rotateY(180deg)' : ''"
      :aria-label="virado ? `Ver ${selo.titulo}` : `Ver a regra de ${selo.titulo}`"
      @click="virado = !virado"
    >
      <!-- frente -->
      <span class="absolute inset-0 [backface-visibility:hidden] painel p-3 flex flex-col items-center">
        <span class="relative w-full flex-1 grid place-items-center">
          <img
            :src="imagem" :alt="selo.titulo"
            class="w-full h-full object-contain transition"
            :style="selo.conquistado ? '' : 'filter: grayscale(1) contrast(.35) brightness(.55); opacity:.55;'"
          />
        </span>

        <span class="w-full mt-2">
          <span class="flex items-center justify-center gap-0.5">
            <svg v-for="i in selo.estrelas" :key="i" width="13" height="13" viewBox="0 0 24 24"
                 :fill="selo.conquistado ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                 :class="selo.conquistado ? 'text-amarelo' : 'text-fumaca'">
              <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
            </svg>
          </span>
          <span
            class="block text-[10px] font-bold uppercase text-center mt-1.5 rounded px-1.5 py-1 border-2 border-tinta"
            :class="selo.conquistado ? cor : 'bg-cartao text-fumaca opacity-60'"
          >{{ selo.titulo }}</span>
          <span class="block text-[11px] font-semibold text-center mt-1.5 leading-snug"
                :class="selo.conquistado ? '' : 'text-fumaca'">
            {{ selo.sub || selo.frase }}
          </span>
        </span>
      </span>

      <!-- verso -->
      <span
        class="absolute inset-0 [backface-visibility:hidden] painel p-4 flex flex-col justify-center text-center"
        style="transform: rotateY(180deg)"
      >
        <span class="rotulo">como conquistar</span>
        <span class="block font-bold text-sm mt-3 leading-snug">{{ selo.regra }}</span>

        <span v-if="selo.conquistado" class="block font-marca text-lg text-verde mt-4">
          conquistado!
        </span>
        <span v-else class="block font-marca text-lg text-fumaca mt-4">ainda não</span>

        <span class="flex items-center justify-center gap-0.5 mt-3">
          <svg v-for="i in selo.estrelas" :key="i" width="12" height="12" viewBox="0 0 24 24"
               fill="currentColor" class="text-amarelo">
            <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
          </svg>
        </span>
      </span>
    </button>
  </div>
</template>
