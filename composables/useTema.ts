const escuro = ref(false);

export function useTema() {
  function aplicar(v: boolean) {
    escuro.value = v;
    if (import.meta.client) {
      document.documentElement.classList.toggle("escuro", v);
      localStorage.setItem("elevesquad-tema", v ? "escuro" : "claro");
    }
  }
  function iniciar() {
    if (!import.meta.client) return;
    const salvo = localStorage.getItem("elevesquad-tema") ?? localStorage.getItem("squadpray-tema");
    if (salvo) aplicar(salvo === "escuro");
    else aplicar(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  const alternar = () => aplicar(!escuro.value);
  return { escuro, alternar, iniciar };
}
