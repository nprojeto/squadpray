<script setup lang="ts">
import { auth } from "~/lib/api";

const email = ref(""); const senha = ref("");
const erro = ref<string | null>(null); const carregando = ref(false);
const eEmail = ref<string | null>(null); const eSenha = ref<string | null>(null);
const { carregar } = useSessao();

async function entrar() {
  erro.value = null; eEmail.value = null; eSenha.value = null;
  if (!email.value.trim()) { eEmail.value = "Informe seu e-mail."; return; }
  if (!senha.value) { eSenha.value = "Informe sua senha."; return; }
  carregando.value = true;
  try {
    await auth.entrar(email.value.trim(), senha.value);
    await carregar();
    await navigateTo("/painel");
  } catch (e: any) { erro.value = e.message; }
  finally { carregando.value = false; }
}

const linhas = 5; const colunas = 14;
const grade = ref<number[][]>([]);
const passo = ref(0);
let timer: any;

onMounted(() => {
  grade.value = Array.from({ length: linhas }, () => Array(colunas).fill(0));
  timer = setInterval(() => {
    const c = passo.value % colunas;
    const falha = c === 9;
    for (let l = 0; l < linhas; l++) grade.value[l][c] = falha && l === 2 ? 2 : 1;
    if (falha) {
      setTimeout(() => {
        for (let l = 0; l < linhas; l++)
          for (let x = 0; x <= c; x++) grade.value[l][x] = x === c && l === 2 ? 2 : 0;
      }, 900);
    }
    passo.value++;
    if (passo.value % colunas === 0)
      grade.value = Array.from({ length: linhas }, () => Array(colunas).fill(0));
  }, 420);
});
onUnmounted(() => clearInterval(timer));

const tipos = [
  { nome: "Oração", icone: "terco", cor: "bg-amarelo", ritmo: "diário" },
  { nome: "Leitura Bíblica", icone: "biblia", cor: "bg-roxo", ritmo: "diário" },
  { nome: "Devocional", icone: "vela", cor: "bg-laranja text-papel", ritmo: "diário" },
  { nome: "Jejum", icone: "pao", cor: "bg-rosa text-papel", ritmo: "diário" },
  { nome: "Livros", icone: "rolo", cor: "bg-verde text-papel", ritmo: "diário" },
  { nome: "Celebração", icone: "sinos", cor: "bg-amarelo", ritmo: "semanal" },
  { nome: "GDC", icone: "peixes", cor: "bg-roxo", ritmo: "semanal" },
];
</script>

<template>
  <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-12 lg:gap-14 items-start">
    <section>
      <span class="rotulo text-xl">todo mundo junto, ou ninguém</span>

      <h1 class="mt-3 text-6xl sm:text-8xl">
        O streak<br />não é seu.<br />
        <span class="bg-laranja text-papel px-3 border-2 border-tinta inline-block -rotate-1 mt-2 shadow-bloco">
          é do squad
        </span>
      </h1>

      <p class="mt-8 text-lg font-medium max-w-xl">
        Um escreve, os outros leem e reagem. Todo mundo cumpre no mesmo dia — ou a
        contagem volta pro zero. Sete dias seguidos e o squad ganha a coroa.
      </p>

      <div class="painel p-5 sm:p-6 mt-9">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <span class="rotulo">um squad de 5 · duas semanas</span>
          <span class="font-marca text-lg text-fumaca">um falha, todos voltam ao zero</span>
        </div>
        <div class="space-y-1.5">
          <div v-for="(linha, i) in grade" :key="i" class="flex gap-1.5">
            <span
              v-for="(v, j) in linha" :key="j"
              class="flex-1 aspect-square rounded-[3px] border-2 border-tinta transition-all duration-500"
              :class="{ 'bg-amarelo': v === 1, 'bg-laranja': v === 2, 'bg-papel border-risco': v === 0 }"
            />
          </div>
        </div>
      </div>

      <div class="mt-10">
        <span class="rotulo">temos sete tipos de squad</span>
        <div class="mt-3 space-y-2">
          <div
            v-for="(t, i) in tipos" :key="t.nome"
            class="flex items-center justify-between border-2 border-tinta px-4 py-2.5 shadow-blocoP"
            :class="[t.cor, i % 2 ? 'rotate-[.4deg]' : '-rotate-[.5deg]']"
          >
            <span class="flex items-center gap-3">
              <EmojiCristao :codigo="t.icone" :tamanho="32" />
              <span class="font-display text-2xl uppercase">{{ t.nome }}</span>
            </span>
            <span class="font-bold text-xs uppercase tracking-widest">{{ t.ritmo }}</span>
          </div>
        </div>
      </div>

      <dl class="grid grid-cols-3 gap-4 mt-10">
        <div><dt class="rotulo">squad</dt><dd class="font-display text-4xl mt-1">3 a 6</dd></div>
        <div><dt class="rotulo">artigo</dt><dd class="font-display text-4xl mt-1">200+</dd></div>
        <div><dt class="rotulo">ciclo vale</dt><dd class="font-display text-4xl mt-1">100</dd></div>
      </dl>
    </section>

    <section class="painel p-7 sm:p-8 lg:sticky lg:top-24">
      <h2 class="text-4xl">Entrar</h2>
      <p class="font-marca text-xl text-laranja mt-1">seu squad tá esperando</p>

      <form novalidate class="mt-6 space-y-4" @submit.prevent="entrar">
        <div>
          <label for="email">E-mail</label>
          <input id="email" v-model="email" type="email" autocomplete="email" placeholder="voce@email.com"
                 :class="eEmail ? '!border-laranja' : ''" @input="eEmail = null" />
          <CampoErro :mensagem="eEmail" />
        </div>
        <div>
          <label for="senha">Senha</label>
          <input id="senha" v-model="senha" type="password" autocomplete="current-password" placeholder="••••••••"
                 :class="eSenha ? '!border-laranja' : ''" @input="eSenha = null" />
          <CampoErro :mensagem="eSenha" />
        </div>

        <AvisoErro :mensagem="erro" />

        <button type="submit" class="btn-ouro w-full" :disabled="carregando">
          {{ carregando ? "Entrando…" : "Entrar" }}
        </button>
      </form>

      <div class="chumbo mt-6 pt-5 text-sm font-semibold">
        Ainda não tem conta?
        <NuxtLink to="/cadastro" class="underline decoration-laranja decoration-4 underline-offset-4 hover:text-laranja">
          Criar minha conta
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
