<template>
  <div class="max-w-2xl">
    <span class="rotulo text-xl">o que vocês já ergueram juntos</span>
    <h1 class="text-5xl sm:text-6xl mt-2">Minhas conquistas</h1>

    <div class="painel p-10 mt-8 text-center">
      <EmojiCristao codigo="coroa" :tamanho="56" class="mx-auto" />
      <p class="font-display text-3xl mt-4">Em construção</p>
      <p class="font-semibold text-fumaca mt-3 max-w-md mx-auto">
        Estamos desenhando as medalhas, os marcos de streak e os troféus de ciclo concluído.
        Enquanto isso, cada dia cumprido já está sendo guardado.
      </p>
      <div class="flex flex-wrap gap-3 justify-center mt-7">
        <NuxtLink to="/painel" class="btn-ouro">Meus squads</NuxtLink>
        <NuxtLink to="/historico" class="btn-vidro">Ver histórico</NuxtLink>
      </div>
    </div>
  </div>
</template>
