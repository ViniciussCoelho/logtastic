import { useRef, useState, type FormEvent } from 'react';
import { Logo } from '../../../components/Logo';
import type { PlayerProfile } from '../../../types/player';
import { useCharacterDraft } from '../useCharacterDraft';
import { BeaverPreview } from './BeaverPreview';
import { FacePicker } from './FacePicker';
import { FurColorPicker } from './FurColorPicker';
import { HatPicker } from './HatPicker';
import { NicknameField } from './NicknameField';

interface CharacterCreatorProps {
  onEnter: (profile: PlayerProfile) => void;
  /** The beaver from the last visit, so leaving The Dam doesn't undo the player's choices. */
  initialProfile?: PlayerProfile;
}

export function CharacterCreator({ onEnter, initialProfile }: CharacterCreatorProps) {
  const { nickname, setNickname, appearance, setFur, setFace, setHat, validation, profile } = useCharacterDraft(initialProfile);
  const [triedToEnter, setTriedToEnter] = useState(false);
  const nicknameInput = useRef<HTMLInputElement>(null);

  // Don't scold an empty field before the player has done anything.
  const showError = !validation.valid && (triedToEnter || nickname.length > 0);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (profile) {
      onEnter(profile);
      return;
    }
    setTriedToEnter(true);
    nicknameInput.current?.focus();
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-full max-w-6xl flex-col px-4 py-4 sm:px-8">
      <header className="flex flex-col items-center gap-1 text-center lg:items-start lg:text-left">
        <h1 className="text-5xl sm:text-6xl">
          <Logo />
        </h1>
        <p className="rounded-full bg-white/85 px-4 py-1 font-display text-lg font-medium text-ink">
          Dress up your beaver, then waddle over to The Dam.
        </p>
      </header>

      <div className="grid flex-1 items-center gap-8 py-4 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-12">
        <BeaverPreview appearance={appearance} nickname={validation.valid ? validation.nickname : ''} />

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Create your beaver"
          className="wood-panel relative flex flex-col gap-4 rounded-[1.75rem] border-4 border-ink p-5 shadow-[0_8px_0_var(--color-ink)] sm:px-7 sm:py-6"
        >
          <Nail className="top-3 left-3" />
          <Nail className="top-3 right-3" />
          <NicknameField
            value={nickname}
            onChange={setNickname}
            error={showError && !validation.valid ? validation.error : null}
            inputRef={nicknameInput}
          />
          <FurColorPicker value={appearance.fur} onChange={setFur} />
          <FacePicker value={appearance.face} fur={appearance.fur} onChange={setFace} />
          <HatPicker value={appearance.hat} onChange={setHat} />
          <button
            type="submit"
            className="mt-1 rounded-2xl border-4 border-bark-900 bg-lantern-400 px-6 py-3.5 font-display text-2xl font-bold text-bark-900 shadow-[0_6px_0_var(--color-bark-900)] transition hover:-translate-y-0.5 hover:bg-[#ffc65c] active:translate-y-1 active:shadow-[0_2px_0_var(--color-bark-900)]"
          >
            Enter The Dam
          </button>
        </form>
      </div>
    </main>
  );
}

function Nail({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-2.5 w-2.5 rounded-full border-2 border-bark-900 bg-[#b9a48a] ${className}`}
    />
  );
}
