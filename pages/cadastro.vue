<script setup lang="ts">
import { auth, api } from "~/lib/api";

const passo = ref(1);
const nome = ref(""); const email = ref(""); const senha = ref(""); const confirma = ref("");
const bio = ref(""); const igreja = ref(""); const ministerios = ref("");
const nascimento = ref(""); const instagram = ref(""); const facebook = ref("");
const tiktok = ref(""); const youtube = ref(""); const publico = ref(true);

const erro = ref<string | null>(null); const pronto = ref(false); const carregando = ref(false);
const eNome = ref<string | null>(null); const eEmail = ref<string | null>(null); const eSenha = ref<string | null>(null); const eConfirma = ref<string | null>(null);
const { carregar } = useSessao();
const base = useRuntimeConfig().app.baseURL;

async function criarConta() {
  erro.value = null; eNome.value = eEmail.value = eSenha.value = eConfirma.value = null;
  if (!nome.value.trim()) { eNome.value = "Diga como podemos te chamar."; return; }
  if (!/.+@.+\..+/.test(email.value.trim())) { eEmail.value = "Digite um e-mail válido."; return; }
  if (senha.value.length < 6) { eSenha.value = "A senha precisa ter pelo menos 6 caracteres."; return; }
  if (senha.value !== confirma.value) { eConfirma.value = "As duas senhas precisam ser iguais."; return; }
  carregando.value = true;
  try {
    const r: any = await auth.cadastrar(nome.value.trim(), email.value.trim(), senha.value);
    if (r?.session) { await carregar(); passo.value = 2; }
    else pronto.value = true;
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}

async function salvarPerfil() {
  erro.value = null; carregando.value = true;
  try {
    await api.atualizarPerfil({
      bio: bio.value.trim(), igreja: igreja.value.trim(), ministerios: ministerios.value.trim(),
      data_nascimento: nascimento.value || undefined,
      instagram: instagram.value.trim(), facebook: facebook.value.trim(),
      tiktok: tiktok.value.trim(), youtube: youtube.value.trim(),
      perfil_publico: publico.value,
    });
    await carregar();
    await navigateTo("/painel");
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <img
      :src="`${base}logo.png`" alt="SquadPray"
      class="w-20 rounded-full border-2 border-tinta shadow-blocoP mb-5"
    />
    <NuxtLink to="/" class="rotulo">← voltar</NuxtLink>
    <h1 class="text-5xl mt-3">{{ passo === 1 ? "Criar conta" : "Seu perfil" }}</h1>
    <p class="font-marca text-xl text-laranja">
      {{ passo === 1 ? "leva menos de um minuto" : "é isso que a rede vai ver sobre você" }}
    </p>

    <div v-if="pronto" class="painel p-7 mt-8 text-center">
      <EmojiCristao codigo="pomba" :tamanho="46" class="mx-auto" />
      <h2 class="text-3xl mt-4">Confirme seu e-mail</h2>
      <p class="font-semibold mt-2 text-sm">
        Enviamos um link para <span class="bg-amarelo px-1">{{ email }}</span>.
      </p>
      <NuxtLink to="/" class="btn-vidro mt-6">Ir para o login</NuxtLink>
    </div>

    <!-- passo 1 -->
    <form v-else-if="passo === 1" novalidate class="painel p-7 mt-8 space-y-4" @submit.prevent="criarConta">
      <div>
        <label for="n">Seu nome</label>
        <input id="n" v-model="nome" placeholder="Como seu squad te chama"
               :class="eNome ? '!border-laranja' : ''" @input="eNome = null" />
        <CampoErro :mensagem="eNome" />
      </div>
      <div>
        <label for="e">E-mail</label>
        <input id="e" v-model="email" type="email" autocomplete="email" placeholder="voce@email.com"
               :class="eEmail ? '!border-laranja' : ''" @input="eEmail = null" />
        <CampoErro :mensagem="eEmail" />
      </div>
      <div>
        <label for="s">Senha</label>
        <input id="s" v-model="senha" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"
               :class="eSenha ? '!border-laranja' : ''" @input="eSenha = null" />
        <CampoErro :mensagem="eSenha" />
      </div>
      <div>
        <label for="s2">Repita a senha</label>
        <input id="s2" v-model="confirma" type="password" autocomplete="new-password" placeholder="Digite a senha de novo"
               :class="eConfirma ? '!border-laranja' : ''" @input="eConfirma = null" />
        <CampoErro :mensagem="eConfirma" />
      </div>
      <AvisoErro :mensagem="erro" />
      <button class="btn-ouro w-full" :disabled="carregando">
        {{ carregando ? "Criando…" : "Continuar" }}
      </button>
    </form>

    <!-- passo 2 -->
    <form v-else class="painel p-7 mt-8 space-y-4" @submit.prevent="salvarPerfil">
      <div>
        <label for="b">Descrição</label>
        <textarea id="b" v-model="bio" rows="3" placeholder="Uma linha sobre você e sua caminhada" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label for="ig">Igreja</label>
          <input id="ig" v-model="igreja" placeholder="Nome da sua igreja" />
        </div>
        <div>
          <label for="dn">Data de nascimento</label>
          <input id="dn" v-model="nascimento" type="date" />
        </div>
      </div>
      <div>
        <label for="mi">Ministérios</label>
        <input id="mi" v-model="ministerios" placeholder="Louvor, Intercessão, GDC…" />
      </div>

      <div class="chumbo pt-5">
        <span class="rotulo">redes sociais</span>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <div><label for="in">Instagram</label><input id="in" v-model="instagram" placeholder="@seuperfil" /></div>
          <div><label for="fb">Facebook</label><input id="fb" v-model="facebook" placeholder="seuperfil" /></div>
          <div><label for="tk">TikTok</label><input id="tk" v-model="tiktok" placeholder="@seuperfil" /></div>
          <div><label for="yt">YouTube</label><input id="yt" v-model="youtube" placeholder="@seucanal" /></div>
        </div>
      </div>

      <label class="flex items-start gap-3 border-2 border-tinta rounded-lg p-4 bg-cartao cursor-pointer">
        <input v-model="publico" type="checkbox" class="!w-5 !h-5 !p-0 mt-0.5 shrink-0" />
        <span class="text-sm font-semibold">
          Deixar meu perfil visível na rede
          <span class="block font-normal text-fumaca text-xs mt-1">
            Desmarcado, outras pessoas veem só seu nome e sua foto.
          </span>
        </span>
      </label>

      <AvisoErro :mensagem="erro" />
      <div class="flex gap-3">
        <button class="btn-ouro flex-1" :disabled="carregando">
          {{ carregando ? "Salvando…" : "Concluir" }}
        </button>
        <NuxtLink to="/painel" class="btn-fantasma">Depois</NuxtLink>
      </div>
    </form>
  </div>
</template>
