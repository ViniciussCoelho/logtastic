import { useMemo } from 'react';
import type { AvatarAppearance } from '../appearance';
import { AVATAR_HEIGHT, AVATAR_WIDTH, type AvatarPose } from '../avatar/pose';
import { renderAvatarLayers } from '../avatar/renderAvatar';
import { svgToDataUri } from '../avatar/svg';

interface BeaverAvatarProps {
  appearance: AvatarAppearance;
  pose: AvatarPose;
  /** Accessible description; omit for purely decorative avatars. */
  label?: string;
  className?: string;
}

/** Stacks the avatar layers exactly as the game does: body first, hat on top. */
export function BeaverAvatar({ appearance, pose, label, className = '' }: BeaverAvatarProps) {
  const { fur, face, hat } = appearance;
  const { direction, step, blink } = pose;
  const layers = useMemo(() => {
    const { body, hat: hatLayer } = renderAvatarLayers({ fur, face, hat }, { direction, step, blink });
    return { body: svgToDataUri(body), hat: hatLayer && svgToDataUri(hatLayer) };
  }, [fur, face, hat, direction, step, blink]);

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  return (
    <div {...a11y} className={`relative ${className}`} style={{ aspectRatio: `${AVATAR_WIDTH} / ${AVATAR_HEIGHT}` }}>
      <img src={layers.body} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {layers.hat && (
        <img src={layers.hat} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      )}
    </div>
  );
}
