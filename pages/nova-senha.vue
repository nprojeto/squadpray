<script setup lang="ts">
import { api } from "~/lib/api";

const senha = ref(""); const confirma = ref("");
const eSenha = ref<string | null>(null); const eConfirma = ref<string | null>(null);
const erro = ref<string | null>(null); const salvando = ref(false);
const { carregar, perfil } = useSessao();

async function salvar() {
  erro.value = null; eSenha.value = null; eConfirma.value = null;
  if (senha.value.length < 6) { eSenha.value = "A senha precisa ter pelo menos 6 caracteres."; return; }
  if (senha.value === "Mudar@123") { eSenha.value = "Escolha uma senha diferente da provisória."; return; }
  if (senha.value !== confirma.value) { eConfirma.value = "As duas senhas precisam ser iguais."; return; }
  salvando.value = true;
  try {
    await api.trocarSenha(senha.value);
    await carregar();
    await navigateTo("/painel");
  } catch (e: any) { erro.value = e.message; }
  finally { salvando.value = false; }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <span class="rotulo text-xl">antes de continuar</span>
    <h1 class="text-5xl mt-2">Nova senha</h1>
    <p class="font-semibold mt-3">
      Você entrou com a senha provisória, {{ perfil?.nome?.split(' ')[0] }}.
      Escolha uma senha sua para seguir.
    </p>

    <form novalidate class="painel p-7 mt-8 space-y-4" @submit.prevent="salvar">
      <div>
        <label for="s">Nova senha</label>
        <input id="s" v-model="senha" type="password" autocomplete="new-password"
               placeholder="Mínimo de 6 caracteres"
               :class="eSenha ? '!border-laranja' : ''" @input="eSenha = null" />
        <CampoErro :mensagem="eSenha" />
      </div>
      <div>
        <label for="c">Repita a nova senha</label>
        <input id="c" v-model="confirma" type="password" autocomplete="new-password"
               placeholder="Digite de novo"
               :class="eConfirma ? '!border-laranja' : ''" @input="eConfirma = null" />
        <CampoErro :mensagem="eConfirma" />
      </div>
      <AvisoErro :mensagem="erro" />
      <button class="btn-ouro w-full" :disabled="salvando">
        {{ salvando ? "Salvando…" : "Salvar e entrar" }}
      </button>
    </form>
  </div>
</template>
