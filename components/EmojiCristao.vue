<script setup lang="ts">
/**
 * Catálogo de ícones sagrados do EleveSquad.
 * Estilo: círculo colorido com contorno, símbolo branco e sombra longa.
 */
const props = withDefaults(defineProps<{ codigo: string; tamanho?: number }>(), { tamanho: 28 });

const cores: Record<string, string> = {
  cruz_palmas: "#1D6B62",   // Amém
  biblia: "#B07BE8",        // Palavra
  pao: "#C98B3A",           // Sustento
  calice: "#C2415C",        // Aliança
  pomba: "#5AA9E6",         // Paz
  espinhos: "#151310",      // Entrega
  tabuas: "#7E9B2E",        // Mandamentos
  terco: "#6B4C8A",         // Intercessão
  vela: "#F04E23",          // Vigília
  peixes: "#1D6B62",        // Multiplicação
  sinos: "#F04E23",         // Celebração
  pulpito: "#8A6A4B",       // Pregação
  rolo: "#5E5A52",          // Escrituras
  unguento: "#C2415C",      // Unção
  coroa: "#F5CE16",         // Coroa do streak
  cruz_ortodoxa: "#4A3E6B", // Fé
  semente: "#1D6B62",
};

// códigos antigos continuam funcionando
const equivalentes: Record<string, string> = {
  amem: "cruz_palmas",
  oracao: "terco",
  cruz: "cruz_ortodoxa",
  fogo: "vela",
  luz: "biblia",
};

const icone = computed(() => equivalentes[props.codigo] ?? props.codigo);
const cor = computed(() => cores[icone.value] ?? "#B07BE8");
const uid = computed(() => `ic-${icone.value}`);
</script>

<template>
  <svg
    :width="tamanho" :height="tamanho" viewBox="0 0 64 64"
    fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
  >
    <defs>
      <clipPath :id="uid"><circle cx="32" cy="32" r="30" /></clipPath>
    </defs>

    <circle cx="32" cy="32" r="30" :fill="cor" />

    <!-- sombra longa -->
    <g :clip-path="`url(#${uid})`">
      <path d="M20 44 L44 20 L64 40 L64 64 L40 64 Z" fill="#151310" opacity=".18" />
    </g>

    <g :clip-path="`url(#${uid})`" fill="#FFFFFF">
      <!-- cruz com palmas -->
      <g v-if="icone === 'cruz_palmas'">
        <path d="M29.4 12h5.2v6.4h6v5.2h-6V52h-5.2V23.6h-6v-5.2h6z" />
        <path d="M32 40c-5.5 1-10.5 4.2-14 9.4 6-2.6 10.4-3.2 14-2.4zM32 40c5.5 1 10.5 4.2 14 9.4-6-2.6-10.4-3.2-14-2.4z" opacity=".9" />
        <path d="M32 41c-3.6 2.6-6.4 6.2-8.2 11 3-3.8 5.6-6.2 8.2-7.4zM32 41c3.6 2.6 6.4 6.2 8.2 11-3-3.8-5.6-6.2-8.2-7.4z" opacity=".75" />
      </g>

      <!-- bíblia aberta -->
      <g v-else-if="icone === 'biblia'">
        <path d="M31 20.5c-3.4-2.6-7.5-3.8-12.4-3.8-1.2 0-2.1.9-2.1 2v22.7c0 1.1.9 2 2.1 2 4.9 0 9 1.2 12.4 3.8zM33 20.5c3.4-2.6 7.5-3.8 12.4-3.8 1.2 0 2.1.9 2.1 2v22.7c0 1.1-.9 2-2.1 2-4.9 0-9 1.2-12.4 3.8z" />
        <path d="M20.5 22.5h7v1.8h-7zM20.5 26.4h7v1.8h-7zM20.5 30.3h7v1.8h-7zM36.5 22.5h7v1.8h-7zM36.5 26.4h7v1.8h-7zM36.5 30.3h7v1.8h-7z" opacity=".35" />
      </g>

      <!-- pão -->
      <g v-else-if="icone === 'pao'">
        <path d="M12 38c0-7.5 6.6-13.5 14.5-13.5S41 30.5 41 38c0 1.5-1.2 2.6-2.7 2.6H14.7C13.2 40.6 12 39.5 12 38z" />
        <path d="M27 40.6c.4-6.8 6.7-12.2 14.4-12.2 7.9 0 14.6 5.9 14.6 13.4 0 1.5-1.2 2.6-2.7 2.6H29.7c-1.5 0-2.7-1.1-2.7-2.6z" opacity=".85" />
        <path d="M17 26.5c1.2-2.6 2.6-4.6 4.2-6M24.5 24.2c1-2.6 2.2-4.7 3.6-6.2M32 25.4c1-2.4 2.2-4.3 3.6-5.7"
              stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".9" />
      </g>

      <!-- cálice -->
      <g v-else-if="icone === 'calice'">
        <path d="M18 14h28v9c0 7.7-6.3 14-14 14s-14-6.3-14-14z" />
        <path d="M18 14h28v5H18z" opacity=".45" />
        <path d="M30 36h4v11h-4z" />
        <path d="M21 47h22v4H21z" />
      </g>

      <!-- pomba -->
      <g v-else-if="icone === 'pomba'">
        <path d="M50 20c-5-1.4-8.7.4-11.7 3.8-3.6 4.1-5.8 9.6-11.5 11.7-5.3 1.9-10.5-.2-13.8-3.6 0 0-1.2 9.2 5.6 14.4 6.4 4.9 15.6 3.6 20.6-2.4 2.2-2.6 3.4-5.6 3.7-8.7 4-2.7 6.2-7.5 7.1-15.2z" />
        <path d="M20 42c4 3.6 9.5 4.8 14.6 3" opacity=".4" />
        <circle cx="45.6" cy="23.4" r="1.7" fill="#151310" />
      </g>

      <!-- coroa de espinhos -->
      <g v-else-if="icone === 'espinhos'">
        <path d="M32 20c9.9 0 18 5.4 18 12s-8.1 12-18 12-18-5.4-18-12 8.1-12 18-12zm0 5c-7.2 0-13 3.1-13 7s5.8 7 13 7 13-3.1 13-7-5.8-7-13-7z" />
        <path d="M32 14.5l2.2 5.6-4.4.1zM14.5 24l5.6 2.2-3.4 3zM49.5 24l-5.6 2.2 3.4 3zM32 49.5l-2.2-5.6 4.4-.1zM17 42.5l4.6-3.6 1.6 4zM47 42.5l-4.6-3.6-1.6 4z" />
      </g>

      <!-- tábuas da lei -->
      <g v-else-if="icone === 'tabuas'">
        <path d="M17 24a8 8 0 0 1 14 0v26H17z" />
        <path d="M33 24a8 8 0 0 1 14 0v26H33z" />
        <g fill="#151310" opacity=".55">
          <path d="M21 30h6v1.8h-6zM21 34h6v1.8h-6zM21 38h6v1.8h-6zM21 42h6v1.8h-6zM37 30h6v1.8h-6zM37 34h6v1.8h-6zM37 38h6v1.8h-6zM37 42h6v1.8h-6z" />
        </g>
      </g>

      <!-- terço -->
      <g v-else-if="icone === 'terco'">
        <path d="M32 12c8.8 0 16 6.5 16 14.5S40.8 41 32 41s-16-6.5-16-14.5S23.2 12 32 12zm0 4c-6.6 0-12 4.7-12 10.5S25.4 37 32 37s12-4.7 12-10.5S38.6 16 32 16z" />
        <g>
          <circle cx="32" cy="13.5" r="2.4" /><circle cx="43" cy="17" r="2.4" /><circle cx="47" cy="26" r="2.4" />
          <circle cx="21" cy="17" r="2.4" /><circle cx="17" cy="26" r="2.4" /><circle cx="24" cy="36" r="2.4" />
          <circle cx="40" cy="36" r="2.4" />
        </g>
        <path d="M29.6 41h4.8v5.4h4.4v4.4h-4.4V56h-4.8v-5.2h-4.4v-4.4h4.4z" />
      </g>

      <!-- vela -->
      <g v-else-if="icone === 'vela'">
        <path d="M32 12c2.6 3.6 5.2 6.4 5.2 9.6 0 3-2.3 5.2-5.2 5.2s-5.2-2.2-5.2-5.2c0-3.2 2.6-6 5.2-9.6z" />
        <path d="M23 30h18v22H23z" />
        <path d="M23 30h18v4c-2.6 1.6-4 3.4-6 3.4S32 34 29 34s-3.6 1.6-6 1.6z" opacity=".55" />
        <path d="M30.6 27h2.8v4h-2.8z" opacity=".8" />
      </g>

      <!-- peixes -->
      <g v-else-if="icone === 'peixes' || icone === 'semente'">
        <path d="M42 18c-7 0-13.6 3.6-16.4 8.4 2.8 4.8 9.4 8.4 16.4 8.4 2.8 0 5.4-.6 7.6-1.5l4.4 3.7-1.4-5.6c1.4-1.4 2.2-3 2.2-4.9 0-5.8-6-8.5-12.8-8.5z" />
        <path d="M25.6 26.4l-9.6-6.4 2.6 8.2-2.6 8.2z" />
        <circle cx="45.6" cy="24.6" r="1.9" fill="#151310" />
        <path d="M22 46c7 0 13.6-3.6 16.4-8.4C35.6 32.8 29 29.2 22 29.2c-2.8 0-5.4.6-7.6 1.5L10 27l1.4 5.6C10 34 9.2 35.6 9.2 37.5c0 5.8 6 8.5 12.8 8.5z" opacity=".75" />
      </g>

      <!-- sinos -->
      <g v-else-if="icone === 'sinos'">
        <path d="M22 20c4.4 0 8 4.4 8 9.8v6.4l3 3.4H11l3-3.4v-6.4C14 24.4 17.6 20 22 20z" />
        <circle cx="22" cy="43" r="3.2" />
        <path d="M42 24c4.4 0 8 4.4 8 9.8v6.4l3 3.4H31l3-3.4v-6.4c0-5.4 3.6-9.8 8-9.8z" opacity=".85" />
        <circle cx="42" cy="47" r="3.2" opacity=".85" />
        <path d="M14 14l4 3M52 18l-4 3" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
      </g>

      <!-- púlpito -->
      <g v-else-if="icone === 'pulpito'">
        <circle cx="32" cy="16" r="5.4" />
        <path d="M25 22c1.8 1.6 4.2 2.6 7 2.6s5.2-1 7-2.6c1.6 1.4 2.6 3.2 2.6 5.4H22.4c0-2.2 1-4 2.6-5.4z" />
        <path d="M18 28h28v24H18z" />
        <path d="M30 33h4v6h5v4h-5v6h-4v-6h-5v-4h5z" fill="#151310" opacity=".6" />
      </g>

      <!-- rolo / pergaminho -->
      <g v-else-if="icone === 'rolo'">
        <path d="M18 22h28v20H18z" />
        <g fill="#151310" opacity=".5">
          <path d="M23 26h18v1.8H23zM23 30h18v1.8H23zM23 34h18v1.8H23zM23 38h14v1.8H23z" />
        </g>
        <path d="M14 22a4 4 0 1 1 0 20 4 4 0 0 1 0-20zM50 22a4 4 0 1 1 0 20 4 4 0 0 1 0-20z" />
        <path d="M8 30h6v1.8H8zM50 30h6v1.8h-6z" opacity=".7" />
      </g>

      <!-- frasco de unção -->
      <g v-else-if="icone === 'unguento'">
        <path d="M28.6 10h6.8v6h-6.8z" />
        <path d="M26 16h12c0 3.4 6 6.6 6 14.6V48c0 3.3-2.7 6-6 6H26c-3.3 0-6-2.7-6-6V30.6C20 22.6 26 19.4 26 16z" />
        <path d="M30 30h4v5h4v4h-4v5h-4v-5h-4v-4h4z" fill="#151310" opacity=".55" />
      </g>

      <!-- coroa -->
      <g v-else-if="icone === 'coroa'">
        <path d="M10 20l9 8.4L32 13l13 15.4L54 20l-4.4 26H14.4z" />
        <path d="M14.4 49.5h35.2v4.5H14.4z" />
        <circle cx="32" cy="35" r="3.2" fill="#151310" opacity=".55" />
      </g>

      <!-- cruz ortodoxa -->
      <g v-else-if="icone === 'cruz_ortodoxa'">
        <path d="M29.4 10h5.2v6H43v4.6h-8.4V27H48v4.8H34.6V54h-5.2V31.8H16V27h13.4v-6.4H21V16h8.4z" />
        <path d="M22 41.6l20-6v4.8l-20 6z" />
      </g>

      <circle v-else cx="32" cy="32" r="12" />
    </g>

    <circle cx="32" cy="32" r="30" fill="none" stroke="#151310" stroke-width="3" />
  </svg>
</template>
