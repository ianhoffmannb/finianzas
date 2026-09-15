/** Subcategorías de gasto variable. El orden es el que se muestra en toda la app. */
export const VARIABLE_CATEGORIES = [
  { key: 'cafe', label: 'Café' },
  { key: 'comida', label: 'Comida' },
  { key: 'panoramas', label: 'Panoramas' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'regalos', label: 'Regalos' },
  { key: 'otros', label: 'Otros' },
] as const;

export type VariableCategory = (typeof VARIABLE_CATEGORIES)[number]['key'];

export const VARIABLE_CATEGORY_KEYS = VARIABLE_CATEGORIES.map((c) => c.key) as VariableCategory[];

export function variableCategoryLabel(key: string): string {
  return VARIABLE_CATEGORIES.find((c) => c.key === key)?.label ?? 'Otros';
}

/**
 * Colores del gráfico de distribución, validados con el script del skill de
 * dataviz (banda de luminosidad, croma, separación para daltonismo y contraste)
 * en claro y oscuro. "Variables" reusa el azul con la trama a 135° del sistema:
 * lleno = comprometido, trama = variable.
 */
export const FLOW_COLORS = {
  light: { fijos: '#0F4CD9', ahorro: '#0F7A58', capex: '#B07219' },
  dark: { fijos: '#5F7FE8', ahorro: '#35A67A', capex: '#BC8235' },
};
