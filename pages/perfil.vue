<script setup lang="ts">
import { api, TIPOS_SQUAD } from "~/lib/api";

const { perfil, squads, carregar, sair } = useSessao();
const nome = ref(""); const bio = ref("");
const salvando = ref(false); const aviso = ref<string | null>(null); const erro = ref<string | null>(null);

watchEffect(() => {
  if (perfil.value) { nome.value = perfil.value.nome; bio.value = perfil.value.bio ?? ""; }
});

async function salvar() {
  erro.value = null; aviso.value = null; salvando.value = true;
  try {
    await api.atualizarPerfil({ nome: nome.value.trim(), bio: bio.value.trim() });
    await carregar(); aviso.value = "Perfil salvo.";
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-4xl">Meu perfil</h1>

    <div class="painel p-7 mt-8 flex items-center justify-between gap-6">
      <div>
        <p class="rotulo">Pontos acumulados</p>
        <p class="font-mono text-5xl font-extrabold text-ouro mt-1">
          {{ Number(perfil?.pontos_total ?? 0).toFixed(1) }}
        </p>
        <p class="text-xs text-sussurro mt-2">Somando todos os squads em que você está.</p>
      </div>
      <EmojiCristao codigo="coroa" :tamanho="56" />
    </div>

    <div class="painel p-7 mt-6">
      <p class="rotulo mb-4">Meus squads</p>
      <ul class="space-y-2 text-sm">
        <li v-for="s in squads" :key="s.id" class="flex items-center justify-between gap-3">
          <NuxtLink :to="`/squad/${s.id}`" class="hover:text-ouro">{{ s.nome }}</NuxtLink>
          <span class="text-sussurro text-xs">
            {{ TIPOS_SQUAD[s.tipo].nome }} · <span class="font-mono">{{ s.streak_atual }}</span>
          </span>
        </li>
      </ul>
      <p v-if="!squads.length" class="text-sussurro text-sm">Você ainda não participa de nenhum squad.</p>
    </div>

    <form class="painel p-7 mt-6 space-y-4" @submit.prevent="salvar">
      <div>
        <label for="n">Nome</label>
        <input id="n" v-model="nome" required />
      </div>
      <div>
        <label for="b">Sobre você</label>
        <textarea id="b" v-model="bio" rows="3" placeholder="Uma linha sobre você" />
      </div>
      <p class="text-xs text-sussurro">E-mail: {{ perfil?.email }} · Fuso: {{ perfil?.timezone }}</p>
      <AvisoErro :mensagem="erro" />
      <AvisoErro :mensagem="aviso" tipo="ok" />
      <div class="flex gap-3">
        <button class="btn-ouro flex-1" :disabled="salvando">{{ salvando ? "Salvando…" : "Salvar" }}</button>
        <button type="button" class="btn-fantasma" @click="sair">Sair da conta</button>
      </div>
    </form>
  </div>
</template>
