const abrirTour = ref(false);
export function useTour() {
  return { abrirTour, comecar: () => { abrirTour.value = true; } };
}
