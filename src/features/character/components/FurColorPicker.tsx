import { FUR_COLORS, type FurColorId } from '../appearance';
import { OptionTile } from './OptionTile';

interface FurColorPickerProps {
  value: FurColorId;
  onChange: (fur: FurColorId) => void;
}

export function FurColorPicker({ value, onChange }: FurColorPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-lg font-semibold text-birch-50">Fur color</legend>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {FUR_COLORS.map((fur) => (
          <OptionTile
            key={fur.id}
            name="fur"
            value={fur.id}
            label={fur.label}
            checked={value === fur.id}
            onSelect={() => onChange(fur.id)}
          >
            {/* Swatch reads like a little furry face: base coat with a lighter muzzle patch. */}
            <span
              className="relative block h-3/5 w-3/5 rounded-full border-[3px]"
              style={{ backgroundColor: fur.palette.base, borderColor: fur.palette.outline }}
            >
              <span
                className="absolute bottom-[12%] left-1/2 h-[42%] w-[58%] -translate-x-1/2 rounded-full"
                style={{ backgroundColor: fur.palette.light }}
              />
            </span>
          </OptionTile>
        ))}
      </div>
    </fieldset>
  );
}
