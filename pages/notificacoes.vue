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

function acao(n: any): { texto: string; para: string } | null {
  const link: string = n.link || "";
  if (link.startsWith("/convites")) return { texto: "Responder convite", para: "/convites" };
  if (link.startsWith("/squad/")) return { texto: "Abrir o squad", para: link };
  if (link.startsWith("/historico")) return { texto: "Ver histórico", para: "/historico" };
  if (link.startsWith("/perfil")) return { texto: "Abrir meu perfil", para: "/perfil" };
  if (link) return { texto: "Abrir", para: link };
  return null;
}
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
      <li v-for="n in lista" :key="n.id" class="painel p-5" :class="n.lida ? 'opacity-70' : ''">
        <div class="flex items-start gap-3">
          <span
            class="w-2.5 h-2.5 rounded-full border-2 border-tinta mt-2 shrink-0"
            :class="n.lida ? 'bg-cartao' : 'bg-laranja'"
          />
          <div class="min-w-0 flex-1">
            <p class="font-display text-xl leading-tight">{{ n.titulo }}</p>
            <p class="text-sm font-semibold mt-1">{{ n.mensagem }}</p>
            <p class="text-xs text-fumaca font-semibold mt-2">{{ dataBR(n.created_at) }}</p>

            <NuxtLink v-if="acao(n)" :to="acao(n)!.para" class="btn-ouro mt-4 !py-2 text-xs">
              {{ acao(n)!.texto }} →
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
