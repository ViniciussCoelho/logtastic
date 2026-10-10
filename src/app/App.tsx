import { lazy, Suspense, useState } from 'react';
import { WoodlandBackdrop } from '../components/WoodlandBackdrop';
import { CharacterCreator } from '../features/character/components/CharacterCreator';
import type { PlayerProfile } from '../types/player';

// Phaser is big; only download it when the player actually enters The Dam.
const DamRoom = lazy(() => import('../features/room/DamRoom').then((module) => ({ default: module.DamRoom })));

export function App() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [inRoom, setInRoom] = useState(false);

  const enter = (profile: PlayerProfile) => {
    setPlayer(profile);
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
