<script setup lang="ts">
import { auth } from "~/lib/api";

const email = ref("");
const senha = ref("");
const erro = ref<string | null>(null);
const carregando = ref(false);
const { carregar } = useSessao();

async function entrar() {
  erro.value = null;
  carregando.value = true;
  try {
    await auth.entrar(email.value.trim(), senha.value);
    await carregar();
    await navigateTo("/painel");
  } catch (e: any) {
    erro.value = e.message;
  } finally {
    carregando.value = false;
  }
}

// vitral vivo do topo: 5 pessoas, um dia da semana
const linhas = 5;
const colunas = 14;
const grade = ref<number[][]>([]);
const passo = ref(0);
let timer: any;

onMounted(() => {
  grade.value = Array.from({ length: linhas }, () => Array(colunas).fill(0));
  timer = setInterval(() => {
    const c = passo.value % colunas;
    // na coluna 9 uma pessoa falha: o vitral inteiro apaga
    const falha = c === 9;
    for (let l = 0; l < linhas; l++) {
      grade.value[l][c] = falha && l === 2 ? 2 : 1;
    }
    if (falha) {
      setTimeout(() => {
        for (let l = 0; l < linhas; l++)
          for (let x = 0; x <= c; x++) grade.value[l][x] = x === c && l === 2 ? 2 : 0;
      }, 900);
    }
    passo.value++;
    if (passo.value % colunas === 0) {
      grade.value = Array.from({ length: linhas }, () => Array(colunas).fill(0));
    }
  }, 420);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <div class="grid lg:grid-cols-[1.15fr_.85fr] gap-12 lg:gap-16 items-start">
    <!-- tese -->
    <section>
      <p class="rotulo">Oração · Leitura · Devocional · Jejum · Celebração · GDC</p>

      <h1 class="mt-4 text-[2.6rem] sm:text-6xl leading-[1.02] font-black">
        O streak não é seu.<br />
        <span class="text-ouro">É do squad inteiro.</span>
      </h1>

      <p class="mt-6 text-lg text-sussurro max-w-xl leading-relaxed">
        Um escreve, os outros leem e reagem. Todo mundo cumpre no mesmo dia, ou o
        vitral apaga e a contagem volta ao zero. Sete dias seguidos e o squad ganha a coroa.
      </p>

      <!-- signature: vitral vivo -->
      <div class="painel p-5 sm:p-6 mt-9">
        <div class="flex items-center justify-between mb-4">
          <p class="rotulo">Um squad de 5 · duas semanas</p>
          <p class="text-[11px] text-sussurro">um falha, todos voltam ao zero</p>
        </div>
        <div class="space-y-1.5">
          <div v-for="(linha, i) in grade" :key="i" class="flex gap-1.5">
            <span
              v-for="(v, j) in linha" :key="j"
              class="flex-1 aspect-square rounded-[3px] border transition-all duration-500"
              :class="{
                'bg-ouro/85 border-ouro shadow-ouro': v === 1,
                'bg-rubi/40 border-rubi': v === 2,
                'bg-noite/60 border-borda': v === 0,
              }"
            />
          </div>
        </div>
      </div>

      <dl class="grid grid-cols-3 gap-4 mt-8">
        <div>
          <dt class="rotulo">Squad</dt>
          <dd class="font-mono text-2xl mt-1">3 a 6</dd>
        </div>
        <div>
          <dt class="rotulo">Artigo</dt>
          <dd class="font-mono text-2xl mt-1">200+</dd>
        </div>
        <div>
          <dt class="rotulo">Ciclo vale</dt>
          <dd class="font-mono text-2xl mt-1">100 pts</dd>
        </div>
      </dl>
    </section>

    <!-- entrar -->
    <section class="painel p-7 sm:p-8 lg:sticky lg:top-24">
      <h2 class="text-2xl">Entrar</h2>
      <p class="text-sm text-sussurro mt-1">Seu squad está esperando.</p>

      <form class="mt-6 space-y-4" @submit.prevent="entrar">
        <div>
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" placeholder="voce@email.com" />
        </div>
        <div>
          <label for="senha">Senha</label>
          <input id="senha" v-model="senha" type="password" required autocomplete="current-password" placeholder="••••••••" />
        </div>

        <AvisoErro :mensagem="erro" />

        <button type="submit" class="btn-ouro w-full" :disabled="carregando">
          {{ carregando ? "Entrando…" : "Entrar" }}
        </button>
      </form>

      <div class="chumbo mt-6 pt-5 text-sm text-sussurro">
        Ainda não tem conta?
        <NuxtLink to="/cadastro" class="text-lilas hover:text-ouro underline underline-offset-4">
          Criar minha conta
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
