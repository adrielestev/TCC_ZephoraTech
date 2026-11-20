/** Durações compartilhadas para que todas as animações pareçam parentes. */
export const motion = {
  fast: 150, // feedback de estado: toque, alternar
  base: 250, // entrada e saída de elementos
  slow: 400, // superfícies grandes
  /** atraso entre itens de uma lista que entra em cascata */
  stagger: 45,
} as const;
