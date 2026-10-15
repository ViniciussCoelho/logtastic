import { lazy, Suspense, useState } from 'react';
import { WoodlandBackdrop } from '../components/WoodlandBackdrop';
import { CharacterCreator } from '../features/character/components/CharacterCreator';
import type { PlayerProfile } from '../types/player';
import { loadProfile, saveProfile } from './localSave';

// Phaser is big; only download it when the player actually enters The Dam.
const DamRoom = lazy(() => import('../features/room/DamRoom').then((module) => ({ default: module.DamRoom })));

export function App() {
  // The last beaver is remembered, but the player still confirms it on the character screen.
  const [player, setPlayer] = useState<PlayerProfile | null>(() => loadProfile());
  const [inRoom, setInRoom] = useState(false);

  const enter = (profile: PlayerProfile) => {
    setPlayer(profile);
    saveProfile(profile);
    setInRoom(true);
  };

  if (player && inRoom) {
    return (
      <Suspense fallback={<div className="h-full bg-ink" />}>
        <DamRoom player={player} onLeave={() => setInRoom(false)} />
      </Suspense>
    );
  }

  return (
    <>
      <WoodlandBackdrop />
      <CharacterCreator onEnter={enter} initialProfile={player ?? undefined} />
    </>
  );
}
