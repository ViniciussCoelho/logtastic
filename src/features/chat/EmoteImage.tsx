import { getFurColor, type FurColorId } from '../character/appearance';
import { svgToDataUri } from '../character/avatar/svg';
import { renderEmote } from './emoteArt';
import { getEmote, type EmoteId } from './emotes';

const cache = new Map<string, string>();

function emoteUri(id: EmoteId, fur: FurColorId): string {
  const key = `${fur}:${id}`;
  let uri = cache.get(key);
  if (!uri) {
    uri = svgToDataUri(renderEmote(id, getFurColor(fur).palette));
    cache.set(key, uri);
  }
  return uri;
}

interface EmoteImageProps {
  id: EmoteId;
  fur: FurColorId;
  className?: string;
  /** Decorative when the surrounding control already names the emote. */
  decorative?: boolean;
}

/** A beaver emote in a given fur, drawn by the same art the game uses. */
export function EmoteImage({ id, fur, className = '', decorative = false }: EmoteImageProps) {
  const { label, emoji } = getEmote(id);
  return (
    <img
      src={emoteUri(id, fur)}
      alt={decorative ? '' : `${label} ${emoji}`}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}
