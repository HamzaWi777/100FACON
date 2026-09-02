export const PRODUCT_COLORS = [
  { value: 'noir', label: 'Noir', hex: '#111827' },
  { value: 'blanc', label: 'Blanc', hex: '#ffffff' },
  { value: 'gris clair', label: 'Gris clair', hex: '#d1d5db' },
  { value: 'gris foncé', label: 'Gris foncé', hex: '#4b5563' },
  { value: 'rouge', label: 'Rouge', hex: '#dc2626' },
  { value: 'rose', label: 'Rose', hex: '#ec4899' },
  { value: 'rose clair', label: 'Rose clair', hex: '#f9a8d4' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'jaune', label: 'Jaune', hex: '#facc15' },
  { value: 'vert', label: 'Vert', hex: '#22c55e' },
  { value: 'vert olive', label: 'Vert olive', hex: '#808000' },
  { value: 'bleu', label: 'Bleu', hex: '#2563eb' },
  { value: 'bleu ciel', label: 'Bleu ciel', hex: '#7dd3fc' },
  { value: 'bleu marine', label: 'Bleu marine', hex: '#172554' },
  { value: 'violet', label: 'Violet', hex: '#9333ea' },
  { value: 'marron', label: 'Marron', hex: '#92400e' },
  { value: 'beige', label: 'Beige', hex: '#d6b98c' },
  { value: 'nude', label: 'Nude', hex: '#b8948b' },
];

const normalizeColor = (color) => color
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

export function getColorDefinition(color) {
  const normalized = normalizeColor(color);
  return PRODUCT_COLORS.find(({ value, label }) => (
    normalizeColor(value) === normalized || normalizeColor(label) === normalized
  ));
}
