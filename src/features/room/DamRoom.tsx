import { useEffect, useRef, useState } from 'react';
import { createDamGame, type DamGameHandle } from '../../game/createDamGame';
import type { ClientEvent, RoomConnection } from '../../services/protocol';
import { createRoomConnection } from '../../services/roomConnection';
import type { PlayerProfile } from '../../types/player';
import { applyChatLogEvent, EMPTY_CHAT_LOG } from '../chat/chatLog';
import type { EmoteId } from '../chat/emotes';
import type { ChatMessageId } from '../chat/messages';
import { createThrottle } from '../chat/throttle';
import { Hud } from './Hud';
import { applyRosterEvent, type Roster } from './roster';

/** Minimum gap between anything the player says, so nobody can flood the room. */
const CHAT_INTERVAL_MS = 800;

interface DamRoomProps {
  player: PlayerProfile;
  onLeave: () => void;
}

/** Owns the room session: one connection and one Phaser game per visit, torn down on leave. */
export function DamRoom({ player, onLeave }: DamRoomProps) {
  const stage = useRef<HTMLDivElement>(null);
  const connection = useRef<RoomConnection | null>(null);
  const game = useRef<DamGameHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [roster, setRoster] = useState<Roster>(new Map());
  const [chatLog, setChatLog] = useState(EMPTY_CHAT_LOG);
  const [selfId, setSelfId] = useState<string | null>(null);
  const chatThrottle = useRef(createThrottle(CHAT_INTERVAL_MS));
  const [namesVisible, setNamesVisible] = useState(true);
  const [filmLook, setFilmLook] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const namesVisibleAtStart = useRef(namesVisible);

  useEffect(() => {
    if (!stage.current) return;
    // A fresh mount node per session keeps Phaser's canvas cleanup independent of React's.
    const mount = document.createElement('div');
    mount.className = 'h-full w-full';
    stage.current.appendChild(mount);

    const room = createRoomConnection();
    // Roster and chat log are folded together so each line is named by who was here at that moment.
    let current: Roster = new Map();
    const stopRoster = room.subscribe((event) => {
      if (event.type === 'welcome') setSelfId(event.selfId);
      current = applyRosterEvent(current, event);
      const snapshot = current;
      setRoster(snapshot);
      setChatLog((log) => applyChatLogEvent(log, event, snapshot));
    });
    const dam = createDamGame(mount, {
      connection: room,
      player,
      namesVisible: namesVisibleAtStart.current,
      onReady: () => setReady(true),
    });
    connection.current = room;
    game.current = dam;

    return () => {
      stopRoster();
      dam.destroy();
      room.close();
      mount.remove();
      connection.current = null;
      game.current = null;
    };
  }, [player]);

  const changeNamesVisible = (visible: boolean) => {
    setNamesVisible(visible);
    game.current?.setNamesVisible(visible);
  };

  const sendChat = (event: ClientEvent): boolean => {
    if (!connection.current || !chatThrottle.current()) return false;
    connection.current.send(event);
    return true;
  };
  const sendPreset = (messageId: ChatMessageId) => sendChat({ type: 'chat', messageId });
  const sendText = (text: string) => sendChat({ type: 'say', text });
  const sendEmote = (emoteId: EmoteId) => sendChat({ type: 'emote', emoteId });

  // Classic cartoon exit: the iris closes, then we leave.
  const leave = () => setLeaving(true);

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#6cc4ef]">
      <div
        ref={stage}
        className={`h-full w-full ${ready ? (leaving ? 'animate-iris-out' : 'animate-iris-in') : 'invisible'}`}
        onAnimationEnd={(event) => {
          if (leaving && event.target === event.currentTarget) onLeave();
        }}
      />
      {filmLook && <div aria-hidden="true" className="film-overlay pointer-events-none absolute inset-0" />}
      {ready ? (
        <Hud
          player={player}
          playerCount={roster.size}
          namesVisible={namesVisible}
          onNamesVisibleChange={changeNamesVisible}
          filmLook={filmLook}
          onFilmLookChange={setFilmLook}
          chatEntries={chatLog.entries}
          selfId={selfId}
          onSendPreset={sendPreset}
          onSendText={sendText}
          onSendEmote={sendEmote}
          onLeave={leave}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-ink" role="status">
          <p className="animate-breathe font-display text-3xl font-semibold text-cream">Building the dam…</p>
        </div>
      )}
    </main>
  );
}
