/** Largura máxima do conteúdo por tipo de tela (centralizado em telas largas). */
export const CONTENT_WIDTHS = { form: 560, content: 720, wide: 1040 } as const;
export type ContentWidth = keyof typeof CONTENT_WIDTHS;

/** Compatibilidade: largura padrão do conteúdo. */
export const CONTENT_MAX_WIDTH = CONTENT_WIDTHS.content;
/** A partir desta largura a navegação principal vira menu lateral. */
export const WIDE_BREAKPOINT = 900;
export const SIDEBAR_WIDTH = 248;
