<script setup lang="ts">
import { api } from "~/lib/api";

const termo = ref(""); const lista = ref<any[]>([]);
const carregando = ref(true); const erro = ref<string | null>(null);
let atraso: any;

async function buscar() {
  carregando.value = true; erro.value = null;
  try { const r: any = await api.rede(termo.value.trim()); lista.value = r.prayers ?? []; }
  catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);
watch(termo, () => { clearTimeout(atraso); atraso = setTimeout(buscar, 350); });
</script>

<template>
  <div>
    <span class="rotulo text-xl">quem mais está nessa</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Rede</h1>
    <p class="font-semibold text-fumaca mt-3 max-w-xl">
      Procure por nome ou igreja. O perfil completo abre só de quem deixou visível.
    </p>

    <div class="mt-6">
      <label for="q" class="sr-only">Buscar</label>
      <input id="q" v-model="termo" placeholder="Nome da pessoa ou da igreja" />
    </div>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Procurando…</p>

    <p v-else-if="!lista.length" class="painel p-8 mt-8 text-center font-semibold">
      Ninguém encontrado com esse termo.
    </p>

    <ul v-else class="grid sm:grid-cols-2 gap-4 mt-8">
      <li v-for="p in lista" :key="p.id">
        <NuxtLink :to="`/prayer/${p.id}`" class="painel p-5 flex items-center gap-4 hover:-translate-y-1 transition">
          <AvatarPerfil :url="p.avatar_url" :nome="p.nome" :tamanho="56" />
          <div class="min-w-0">
            <p class="font-display text-xl truncate">{{ p.nome }}</p>
            <p v-if="p.igreja" class="text-xs font-semibold text-fumaca truncate">{{ p.igreja }}</p>
            <p v-else-if="!p.perfil_publico" class="text-xs font-semibold text-fumaca">perfil fechado</p>
            <p class="font-mono text-sm font-bold mt-0.5">{{ Number(p.pontos_total).toFixed(0) }} pts</p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
