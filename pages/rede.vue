<script setup lang="ts">
import { api } from "~/lib/api";

const termo = ref(""); const lista = ref<any[]>([]);
const aba = ref<"geral" | "favoritos">("geral");
const souPublico = ref(true);
const carregando = ref(true); const erro = ref<string | null>(null);
let atraso: any;

async function buscar() {
  carregando.value = true; erro.value = null;
  try {
    const r: any = await api.rede(termo.value.trim(), aba.value);
    lista.value = r.prayers ?? [];
    souPublico.value = r.sou_publico !== false;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
onMounted(buscar);
watch(termo, () => { clearTimeout(atraso); atraso = setTimeout(buscar, 350); });
watch(aba, buscar);

async function alternarFavorito(p: any) {
  erro.value = null;
  const novo = !p.favorito;
  try {
    await api.favoritar(p.id, novo);
    p.favorito = novo;
    if (aba.value === "favoritos" && !novo) lista.value = lista.value.filter((x) => x.id !== p.id);
  } catch (e: any) { erro.value = e.message; }
}
</script>

<template>
  <div>
    <span class="rotulo text-xl">quem mais está nessa</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Rede</h1>

    <div v-if="!souPublico" class="painel p-5 mt-6 !border-laranja">
      <p class="font-semibold text-sm">
        Seu perfil está fechado. Você consegue procurar quem já está aqui, mas não abre perfis
        nem favorita ninguém. A rede funciona nos dois sentidos.
      </p>
      <NuxtLink to="/perfil" class="btn-ouro mt-4 !py-2 text-xs">Abrir meu perfil</NuxtLink>
    </div>

    <nav class="grid grid-cols-2 gap-2 mt-6">
      <button
        v-for="a in [{ k: 'geral', t: 'Geral' }, { k: 'favoritos', t: 'Favoritos' }]" :key="a.k"
        class="rounded-lg border-2 border-tinta px-3 py-2.5 font-display uppercase text-lg transition"
        :class="aba === a.k ? 'bg-amarelo shadow-blocoP' : 'bg-cartao text-fumaca hover:bg-amarelo/40'"
        @click="aba = a.k as any"
      >{{ a.t }}</button>
    </nav>

    <div class="mt-4">
      <label for="q" class="sr-only">Buscar</label>
      <input id="q" v-model="termo" placeholder="Nome da pessoa ou da igreja" />
    </div>

    <AvisoErro :mensagem="erro" class="mt-6" />
    <p v-if="carregando" class="mt-8 font-semibold">Procurando…</p>

    <p v-else-if="!lista.length" class="painel p-8 mt-8 text-center font-semibold">
      {{ aba === 'favoritos'
        ? 'Você ainda não favoritou ninguém. Marque a estrela em quem quiser acompanhar.'
        : 'Ninguém encontrado com esse termo.' }}
    </p>

    <ul v-else class="grid sm:grid-cols-2 gap-4 mt-8">
      <li v-for="p in lista" :key="p.id" class="painel p-5 flex items-center gap-4">
        <NuxtLink :to="`/prayer/${p.id}`" class="flex items-center gap-4 min-w-0 flex-1 hover:text-laranja">
          <AvatarPerfil :url="p.avatar_url" :nome="p.nome" :tamanho="56" />
          <div class="min-w-0">
            <p class="font-display text-xl truncate">{{ p.nome }}</p>
            <p v-if="p.igreja" class="text-xs font-semibold text-fumaca truncate">{{ p.igreja }}</p>
            <p v-else-if="!p.perfil_publico" class="text-xs font-semibold text-fumaca">perfil fechado</p>
            <p class="font-mono text-sm font-bold mt-0.5">{{ Number(p.pontos_total).toFixed(0) }} pts</p>
          </div>
        </NuxtLink>

        <button
          v-if="souPublico && p.perfil_publico"
          class="w-11 h-11 shrink-0 grid place-items-center rounded-lg border-2 border-tinta transition"
          :class="p.favorito ? 'bg-amarelo shadow-blocoP' : 'bg-cartao hover:bg-amarelo/50'"
          :aria-label="p.favorito ? 'Tirar dos favoritos' : 'Favoritar'"
          @click="alternarFavorito(p)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" :fill="p.favorito ? 'currentColor' : 'none'"
               stroke="currentColor" stroke-width="2.2" stroke-linejoin="round">
            <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>
