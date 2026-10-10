import { useState } from 'react';
import type { PlayerProfile } from '../../types/player';
import { DEFAULT_APPEARANCE, type AvatarAppearance, type FaceId, type FurColorId, type HatId } from './appearance';
import { validateNickname } from './nickname';

/** Form state for the character screen; turns into a PlayerProfile once the nickname is valid. */
export function useCharacterDraft(initial?: PlayerProfile) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '');
  const [appearance, setAppearance] = useState<AvatarAppearance>(initial?.appearance ?? DEFAULT_APPEARANCE);
  const validation = validateNickname(nickname);

  const setFur = (fur: FurColorId) => setAppearance((current) => ({ ...current, fur }));
  const setFace = (face: FaceId) => setAppearance((current) => ({ ...current, face }));
  const setHat = (hat: HatId) => setAppearance((current) => ({ ...current, hat }));

  const profile: PlayerProfile | null = validation.valid ? { nickname: validation.nickname, appearance } : null;

  return { nickname, setNickname, appearance, setFur, setFace, setHat, validation, profile };
}
