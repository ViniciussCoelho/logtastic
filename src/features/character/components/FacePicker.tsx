import { useMemo } from 'react';
import { FACES, getFurColor, type FaceId, type FurColorId } from '../appearance';
import { renderFaceThumbnail } from '../avatar/beaverBody';
import { svgToDataUri } from '../avatar/svg';
import { OptionTile } from './OptionTile';

interface FacePickerProps {
  value: FaceId;
  fur: FurColorId;
  onChange: (face: FaceId) => void;
}

/** Each option previews the face on the player's current fur. */
export function FacePicker({ value, fur, onChange }: FacePickerProps) {
  const thumbnails = useMemo(() => {
    const palette = getFurColor(fur).palette;
    return new Map(FACES.map((face) => [face.id, svgToDataUri(renderFaceThumbnail(palette, face.id))]));
  }, [fur]);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-display text-lg font-semibold text-birch-50">Face</legend>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {FACES.map((face) => (
          <OptionTile
            key={face.id}
            name="face"
            value={face.id}
            label={face.label}
            checked={value === face.id}
            onSelect={() => onChange(face.id)}
          >
            <img src={thumbnails.get(face.id)} alt="" className="w-[88%]" draggable={false} />
          </OptionTile>
        ))}
      </div>
    </fieldset>
  );
}
