<script setup lang="ts">
import { auth } from "~/lib/api";

const nome = ref(""); const email = ref(""); const senha = ref("");
const erro = ref<string | null>(null); const pronto = ref(false); const carregando = ref(false);
const { carregar } = useSessao();

async function cadastrar() {
  erro.value = null;
  if (senha.value.length < 6) { erro.value = "A senha precisa ter pelo menos 6 caracteres."; return; }
  carregando.value = true;
  try {
    const r: any = await auth.cadastrar(nome.value.trim(), email.value.trim(), senha.value);
    if (r?.session) { await carregar(); await navigateTo("/painel"); }
    else pronto.value = true;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <NuxtLink to="/" class="rotulo hover:text-texto">← voltar</NuxtLink>
    <h1 class="text-4xl mt-4">Criar minha conta</h1>
    <p class="text-sussurro mt-2">Leva menos de um minuto.</p>

    <div v-if="pronto" class="painel p-7 mt-8 text-center">
      <EmojiCristao codigo="pomba" :tamanho="44" class="mx-auto" />
      <h2 class="text-2xl mt-4">Confirme seu e-mail</h2>
      <p class="text-sussurro mt-2 text-sm">
        Enviamos um link para <span class="text-texto">{{ email }}</span>.
        Abra o e-mail, clique no link e volte para entrar.
      </p>
      <NuxtLink to="/" class="btn-vidro mt-6">Ir para o login</NuxtLink>
    </div>

    <form v-else class="painel p-7 mt-8 space-y-4" @submit.prevent="cadastrar">
      <div>
        <label for="n">Seu nome</label>
        <input id="n" v-model="nome" required placeholder="Como seu squad te chama" />
      </div>
      <div>
        <label for="e">E-mail</label>
        <input id="e" v-model="email" type="email" required autocomplete="email" placeholder="voce@email.com" />
      </div>
      <div>
        <label for="s">Senha</label>
        <input id="s" v-model="senha" type="password" required autocomplete="new-password" placeholder="Mínimo de 6 caracteres" />
      </div>
      <AvisoErro :mensagem="erro" />
      <button class="btn-ouro w-full" :disabled="carregando">
        {{ carregando ? "Criando…" : "Criar conta" }}
      </button>
    </form>
  </div>
</template>
