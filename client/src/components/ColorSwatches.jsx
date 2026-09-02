import { getColorDefinition, PRODUCT_COLORS } from '../constants/colors';

export function ColorSwatches({ colors = [], value, onChange, getStock, prefix = '', name = 'Couleur' }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-3">
      {colors.map((color) => {
        const definition = getColorDefinition(color);
        const stock = getStock ? getStock(color) : null;
        const disabled = stock !== null && stock <= 0;
        const selected = value === color;
        const colorValue = definition?.hex || '#e5e7eb';

        return (
          <button
            key={`${prefix}${color}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${definition?.label || color}${disabled ? ' (Rupture)' : ''}`}
            title={disabled ? 'En rupture' : definition?.label || color}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={`flex w-14 flex-col items-center gap-1.5 rounded-lg p-1 text-xs text-gray-700 transition ${
              selected ? 'font-bold text-gray-900' : 'hover:text-gray-950'
            } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
          >
            <span
              className={`relative h-10 w-10 rounded-full border-2 shadow-sm ${
                selected ? 'border-gray-900 ring-2 ring-teal-900 ring-offset-2' : 'border-gray-300'
              }`}
              style={{ backgroundColor: colorValue }}
            >
              {disabled && <span className="absolute inset-1/2 h-0.5 w-10 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-600" />}
            </span>
            <span className="max-w-full truncate">{definition?.label || color}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorPalette({ selectedColors = [], onToggle, name = 'Couleurs' }) {
  return (
    <div role="group" aria-label={name} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {PRODUCT_COLORS.map((color) => {
        const selected = selectedColors.includes(color.value);
        return (
          <button
            key={color.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(color.value)}
            className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
              selected ? 'border-purple-600 bg-purple-50 font-semibold text-purple-900' : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <span className="h-6 w-6 flex-shrink-0 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />
            <span className="truncate">{color.label}</span>
          </button>
        );
      })}
    </div>
  );
}
