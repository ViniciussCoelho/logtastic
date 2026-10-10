import { useMemo } from 'react';
import { HATS, type HatId } from '../appearance';
import { renderHatThumbnail } from '../avatar/hats';
import { svgToDataUri } from '../avatar/svg';
import { OptionTile } from './OptionTile';

interface HatPickerProps {
  value: HatId;
  onChange: (hat: HatId) => void;
}

export function HatPicker({ value, onChange }: HatPickerProps) {
  const thumbnails = useMemo(
    () =>
      new Map(HATS.map((hat) => [hat.id, hat.id === 'none' ? null : svgToDataUri(renderHatThumbnail(hat.id))])),
    [],
  );

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-lg font-semibold text-birch-50">Hat</legend>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {HATS.map((hat) => {
          const thumbnail = thumbnails.get(hat.id);
          return (
            <OptionTile
              key={hat.id}
              name="hat"
              value={hat.id}
              label={hat.label}
              checked={value === hat.id}
              onSelect={() => onChange(hat.id)}
            >
              {thumbnail ? (
                <img src={thumbnail} alt="" className="w-[86%]" draggable={false} />
              ) : (
                <svg viewBox="0 0 40 40" className="w-1/2" aria-hidden="true">
                  <circle cx="20" cy="20" r="15" fill="none" stroke="#8a5a36" strokeWidth="3.5" strokeDasharray="5 4" />
                  <path d="M10 30 L30 10" stroke="#8a5a36" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              )}
            </OptionTile>
          );
        })}
      </div>
    </fieldset>
  );
}
