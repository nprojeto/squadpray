<script setup lang="ts">
import { api, dataBR } from "~/lib/api";

const lista = ref<any[]>([]); const carregando = ref(true); const erro = ref<string | null>(null);
const { carregar } = useSessao();

onMounted(async () => {
  try {
    const r: any = await api.notificacoes();
    lista.value = r.notificacoes ?? [];
    await api.marcarLidas();
    await carregar();
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
});
</script>

<template>
  <div class="max-w-2xl">
    <span class="rotulo text-xl">o que rolou enquanto você não olhava</span>
    <h1 class="text-5xl mt-2">Notificações</h1>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Carregando…</p>

    <div v-else-if="!lista.length" class="painel p-8 mt-8 text-center">
      <EmojiCristao codigo="pomba" :tamanho="44" class="mx-auto" />
      <p class="font-display text-2xl mt-3">Tudo em dia</p>
      <p class="text-fumaca font-semibold text-sm mt-1">Nada novo por enquanto.</p>
    </div>

    <ul v-else class="mt-8 space-y-3">
      <li v-for="n in lista" :key="n.id" class="painel p-5" :class="n.lida ? 'opacity-65' : ''">
        <component :is="n.link ? 'NuxtLink' : 'div'" :to="n.link || undefined" class="block">
          <p class="font-display text-xl">{{ n.titulo }}</p>
          <p class="text-sm font-semibold mt-1">{{ n.mensagem }}</p>
          <p class="text-xs text-fumaca mt-2">{{ dataBR(n.created_at) }}</p>
        </component>
      </li>
    </ul>
  </div>
</template>
