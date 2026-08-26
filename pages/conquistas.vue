<script setup lang="ts">
import { api } from "~/lib/api";

const selos = ref<any[]>([]);
const carregando = ref(true);
const erro = ref<string | null>(null);
const base = useRuntimeConfig().app.baseURL;
const { perfil } = useSessao();
const { verificar } = useConquistas();

onMounted(async () => {
  try {
    const r: any = await api.conquistas();
    selos.value = r.selos ?? [];
    await verificar();
  }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
});

const imagem = (c: string) => `${base.replace(/\/$/, "")}/selos/${c}.png`;
</script>

<template>
  <div>
    <span class="rotulo text-xl">o que você construiu em família</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Galeria dos Heróis</h1>
    <p class="font-semibold text-fumaca mt-3 max-w-xl">
      Toque na figurinha para ver o que é preciso para conquistar.
    </p>

    <p v-if="perfil?.streak_individual" class="font-marca text-xl text-laranja mt-3">
      seu streak pessoal está em {{ perfil.streak_individual }}
      {{ perfil.streak_individual === 1 ? 'dia' : 'dias' }}
    </p>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <ul v-else class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-8 items-stretch">
      <li v-for="s in selos" :key="s.codigo">
        <SeloConquista :selo="s" :imagem="imagem(s.codigo)" />
      </li>
    </ul>
  </div>
</template>
