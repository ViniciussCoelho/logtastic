import { Logo } from '../../components/Logo';
import { IDLE_POSE } from '../character/avatar/pose';
import { BeaverAvatar } from '../character/components/BeaverAvatar';
import { ChatBar } from '../chat/ChatBar';
import type { ChatLogEntry } from '../chat/chatLog';
import type { EmoteId } from '../chat/emotes';
import type { ChatMessageId } from '../chat/messages';
import type { PlayerProfile } from '../../types/player';
import { SettingsMenu } from './SettingsMenu';

interface HudProps {
  player: PlayerProfile;
  playerCount: number;
  namesVisible: boolean;
  onNamesVisibleChange: (visible: boolean) => void;
  filmLook: boolean;
  onFilmLookChange: (enabled: boolean) => void;
  chatEntries: readonly ChatLogEntry[];
  selfId: string | null;
  onSendPreset: (messageId: ChatMessageId) => boolean;
  onSendText: (text: string) => boolean;
  onSendEmote: (emoteId: EmoteId) => boolean;
  emotesEnabled: boolean;
  onLeave: () => void;
}

/** Kept to the corners and bottom edge so the room stays the star. Only the controls catch clicks. */
export function Hud({ player, playerCount, chatEntries, selfId, onSendPreset, onSendText, onSendEmote, emotesEnabled, onLeave, ...settings }: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex min-w-0 items-center gap-3">
          {/* The logo yields to the player's own name tag on phones. */}
          <span className="hidden text-3xl sm:inline sm:text-4xl">
            <Logo />
          </span>
          <span className="flex min-w-0 items-center gap-2 rounded-full border-[3px] border-ink bg-white py-0.5 pr-4 pl-0.5 shadow-[0_3px_0_var(--color-ink)]">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-sky-200">
              <span className="absolute" style={{ width: 72, left: -16, top: -10 }}>
                <BeaverAvatar appearance={player.appearance} pose={IDLE_POSE} className="w-full" />
              </span>
            </span>
            <span className="max-w-[10rem] truncate font-display text-lg font-semibold text-ink">{player.nickname}</span>
          </span>
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="rounded-full border-[3px] border-ink bg-white px-3 py-1.5 font-display text-lg font-semibold whitespace-nowrap text-ink tabular-nums shadow-[0_3px_0_var(--color-ink)] sm:px-4"
            aria-live="polite"
          >
            {playerCount}
            <span className="sr-only sm:not-sr-only"> {playerCount === 1 ? 'beaver' : 'beavers'} here</span>
            <span aria-hidden="true" className="sm:hidden">
              {' '}
              🦫
            </span>
          </span>
          <SettingsMenu {...settings} onLeave={onLeave} />
        </div>
      </div>
      <div className="pointer-events-auto self-center">
        <ChatBar
          fur={player.appearance.fur}
          entries={chatEntries}
          selfId={selfId}
          onSendPreset={onSendPreset}
          onSendText={onSendText}
          onSendEmote={onSendEmote}
          emotesEnabled={emotesEnabled}
        />
      </div>
    </div>
  );
}
