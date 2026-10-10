/**
 * Avatar appearance catalogue. IDs are stable: they are what gets stored and,
 * later, sent to the Go backend — never the display labels or colors.
 */

/** Every beaver shares the same warm dark-brown ink line. */
const INK = '#2a1d17';

export const FUR_COLOR_IDS = ['classic-brown', 'dark-chocolate', 'golden-brown', 'ash-gray', 'cream'] as const;
export type FurColorId = (typeof FUR_COLOR_IDS)[number];

export const FACE_IDS = ['dots', 'sparkle', 'happy', 'cool', 'wink'] as const;
export type FaceId = (typeof FACE_IDS)[number];

export const HAT_IDS = ['none', 'baseball-cap', 'beanie', 'straw-hat', 'explorer-hat'] as const;
export type HatId = (typeof HAT_IDS)[number];

export interface AvatarAppearance {
  fur: FurColorId;
  face: FaceId;
  hat: HatId;
}

/** Colors used to paint one fur variant. Tail, nose and teeth are shared by every beaver. */
export interface FurPalette {
  base: string;
  shade: string;
  light: string;
  outline: string;
}

export interface FurColorOption {
  id: FurColorId;
  label: string;
  palette: FurPalette;
}

export interface FaceOption {
  id: FaceId;
  label: string;
}

export interface HatOption {
  id: HatId;
  label: string;
}

export const FUR_COLORS: readonly FurColorOption[] = [
  {
    id: 'classic-brown',
    label: 'Classic Brown',
    palette: { base: '#9a5b34', shade: '#77412a', light: '#e2b483', outline: INK },
  },
  {
    id: 'dark-chocolate',
    label: 'Dark Chocolate',
    palette: { base: '#5f3a27', shade: '#45291c', light: '#c0916b', outline: INK },
  },
  {
    id: 'golden-brown',
    label: 'Golden Brown',
    palette: { base: '#c98a3f', shade: '#a2682b', light: '#f3d199', outline: INK },
  },
  {
    id: 'ash-gray',
    label: 'Ash Gray',
    palette: { base: '#8e8780', shade: '#6c655f', light: '#d9d2c8', outline: INK },
  },
  {
    id: 'cream',
    label: 'Cream',
    palette: { base: '#e8d2a8', shade: '#c7aa7c', light: '#fcf3df', outline: INK },
  },
];

export const FACES: readonly FaceOption[] = [
  { id: 'dots', label: 'Dots' },
  { id: 'sparkle', label: 'Sparkly' },
  { id: 'happy', label: 'Happy' },
  { id: 'cool', label: 'Cool' },
  { id: 'wink', label: 'Wink' },
];

export const HATS: readonly HatOption[] = [
  { id: 'none', label: 'No hat' },
  { id: 'baseball-cap', label: 'Baseball cap' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'straw-hat', label: 'Straw hat' },
  { id: 'explorer-hat', label: 'Explorer hat' },
];

export const DEFAULT_APPEARANCE: AvatarAppearance = { fur: 'classic-brown', face: 'dots', hat: 'none' };

export function getFurColor(id: FurColorId): FurColorOption {
  const option = FUR_COLORS.find((fur) => fur.id === id);
  if (!option) throw new Error(`Unknown fur color: ${id}`);
  return option;
}

export function getFace(id: FaceId): FaceOption {
  const option = FACES.find((face) => face.id === id);
  if (!option) throw new Error(`Unknown face: ${id}`);
  return option;
}

export function getHat(id: HatId): HatOption {
  const option = HATS.find((hat) => hat.id === id);
  if (!option) throw new Error(`Unknown hat: ${id}`);
  return option;
}

/** Narrows untrusted data (e.g. a future server payload) to a known appearance. */
export function isAvatarAppearance(value: unknown): value is AvatarAppearance {
  if (typeof value !== 'object' || value === null) return false;
  const { fur, face, hat } = value as Record<string, unknown>;
  return (
    FUR_COLOR_IDS.includes(fur as FurColorId) &&
    FACE_IDS.includes(face as FaceId) &&
    HAT_IDS.includes(hat as HatId)
  );
}

export function describeAppearance({ fur, face, hat }: AvatarAppearance): string {
  const hatLabel = hat === 'none' ? 'no hat' : getHat(hat).label.toLowerCase();
  return `${getFurColor(fur).label} fur, ${getFace(face).label.toLowerCase()} face, ${hatLabel}`;
}
