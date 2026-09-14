type ChipKind = 'fijo' | 'variable' | 'supone' | 'devida' | 'ejemplo' | 'sincerrar';

const CLASS_MAP: Record<ChipKind, string> = {
  fijo: 'chip chip-fijo',
  variable: 'chip chip-variable',
  supone: 'chip chip-supone',
  devida: 'chip chip-devida',
  ejemplo: 'chip chip-ejemplo',
  sincerrar: 'chip chip-sincerrar',
};

const LABEL_MAP: Record<ChipKind, string> = {
  fijo: 'FIJO',
  variable: 'VARIABLE',
  supone: 'SUPONE SUELDO',
  devida: 'DE VIDA',
  ejemplo: 'EJEMPLO',
  sincerrar: 'SIN CERRAR',
};

export function Chip({ kind, label }: { kind: ChipKind; label?: string }) {
  return <span className={CLASS_MAP[kind]}>{label ?? LABEL_MAP[kind]}</span>;
}
