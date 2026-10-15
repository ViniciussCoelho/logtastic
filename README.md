# Logtastic — MVP 0.1: The Dam

A cozy 2D social game: dress up a beaver, enter The Dam, walk around and chat.
This repo is the **frontend**. The multiplayer room is the Go server in `../logtastic-server`.

```bash
npm install
npm run dev        # http://localhost:5173, plays against the Go server (start it first, see below)
npm run dev:mock   # http://localhost:5173, offline mock room with simulated beavers
npm test           # unit + component tests (Vitest)
npm run lint       # oxlint (TypeScript 7 has no JS API, so typescript-eslint can't run)
npm run test:e2e   # browser journeys (Playwright, starts its own dev server on the mock room)
npm run build      # typecheck + production build
```

### Running with the server

```bash
cd ../logtastic-server && go run ./cmd/server     # ws://localhost:8080/ws
cd ../logtasticv2 && npm run dev                   # open http://localhost:5173 in two tabs
```

| Variable | Meaning |
| --- | --- |
| `VITE_WS_URL` | Room server WebSocket URL. In development it defaults to `ws://localhost:8080/ws`; a production build without it uses `/ws` on the page's own host. |
| `VITE_ROOM_MOCK` | `true` plays against the offline mock room instead of a server. |

Open the app on `localhost`, not `127.0.0.1`: the server only accepts WebSocket origins matching `localhost:*`.

## Look

Chubby, bean-shaped beavers with stubby arms, cheek tufts, a cream muzzle-to-belly patch, buck teeth
and a paddle tail, drawn in warm dark-brown ink. Players pick fur, face and hat.

The room is painted like a classic online-hangout room:

- A close camera, with a big landmark (a log lookout tower) framing an open plank floor in perspective.
- Cel-shaded shapes with a lit side and a shadow side.
- Foreground rocks cut off by the frame.
- A hand-drawn wobble over every line (an SVG displacement filter).
Old-cartoon touches: an iris wipe in and out of the room, a squash-and-stretch idle bounce, and an optional
film-grain overlay (Settings → Old film look). All art is original and drawn in code as SVG.

## Playing

- **Click or tap** the deck to walk. Your beaver has a gold ring under its feet.
- **Enter** jumps into the chat field, **↑** brings back your last typed message, and **Esc** leaves the field or closes a menu.
- **1–9** send the first nine emotes (the numbers are shown in the emote menu).
- Sending faster than every 800 ms shakes the chat bar and shows a "busy beaver" hint instead of silently dropping it.
- Balloons stay up for at least 1.6 s. Quick follow-ups wait their turn (up to 3 per beaver).
- Your beaver and settings are remembered in this browser (`localStorage`). The character screen opens pre-filled.
- **Phones:** on portrait screens the view keeps the full room height and the camera follows your beaver.
  The HUD gets compact on narrow or short screens.

## Structure

```
src/
  app/                      Screen switching (character screen ↔ The Dam, lazy-loaded)
  components/               Shared UI: Logo, backdrop, HUD button, useDismiss
  features/
    character/              Appearance catalogue, nickname rules, the character screen
      avatar/               The single avatar renderer (body + face, hat layer), shared with Phaser
    chat/                   Predefined message catalogue and the chat menu
    room/                   DamRoom (owns connection + game), HUD, settings, roster
  game/                     Phaser: layout, movement/collision, textures, scene, entities, art
  services/
    protocol.ts             The app's room events and the RoomConnection interface
    roomConnection.ts       Picks the Go server connection or the mock
    websocketRoomConnection.ts
    serverWire.ts           Go server wire format: validation and translation
    mocks/                  Mock room server with simulated beavers
  types/
```

## How the pieces talk

- **React → Phaser**: `createDamGame(parent, options)` returns a tiny handle (`setNamesVisible`, `destroy`).
- **Room → both**: one `RoomConnection` per visit. The Phaser scene renders players from its events.
  The HUD derives the player count from the same events. The HUD sends chat through the connection.
- **Phaser → room**: the scene sends `join` and the local player's `move` targets.

## Avatar rendering

`renderAvatarLayers(appearance, pose)` returns two SVGs on a shared 120×150 canvas:

- **Body layer**: fur palette plus the chosen face.
- **Hat layer**: independent, so it stacks on any body.

A pose is a direction (front/back/left/right), a walk step (0 = standing, 1 and 2 = strides) and a blink flag.
The character screen stacks the layers as images. The game rasterizes the same SVGs into Phaser textures at 2x.
Future clothing would be one more layer in the same pattern.

## Protocol (Go server)

Every message is a `{ "type", "payload" }` envelope; see `logtastic-server/internal/protocol`.
Only `src/services/serverWire.ts` knows this format. It validates what arrives and translates it
to and from the app's own room events (`src/services/protocol.ts`), which is all the scene and HUD see.

| Direction | Message | Payload | App event |
| --- | --- | --- | --- |
| client → server | `player_join` | `nickname`, `furColor`, `eyeId`, `hatId` | `join` (fur, face, hat IDs from `appearance.ts`) |
| client → server | `player_move` | `x`, `y` (world pixels, 1920×1080 room) | `move` (a walk target) |
| client → server | `chat_send` | `text` | `say`, and quick messages as their text |
| server → client | `player_joined` + `room_state` | own Player, then everyone already here | `welcome` |
| server → client | `player_entered` | Player | `player_joined` |
| server → client | `player_left` | `id` | `player_left` |
| server → client | `player_moved` | `id`, `x`, `y` | `player_moved` (remote beavers walk there) |
| server → client | `chat_received` | `playerId`, `nickname`, `text` (also echoed to the sender) | `say` |

How the client meets the server's rules:

- **Moves:** sent only for the local player, on click. They're paced at one per 60 ms (under the
  server's 20 per second), and a burst collapses into its latest target.
- **Chat:** the client waits 800 ms between sends (server allows 2 per second). Typed messages are
  capped at 80 characters; the server allows 200. Incoming chat is accepted up to 200.
- **Own chat** is rendered from the server's echo only, so it never shows twice.
- **Text is never HTML:** bubbles are Phaser text and history lines are React text nodes.
- **Connection problems:** if the room can't be reached (or doesn't answer the join within 10 s),
  or the connection drops, a notice takes the player back to the character screen. No auto-reconnect.

Known gaps between the client and the server today:

- **Spawn:** the server creates every player at `(0, 0)`, off the deck. The client starts its
  own beaver at the room's spawn point and immediately sends that as its first move, so everyone agrees.
- **Emotes:** the server has no emote message, so the emote menu and the 1–9 keys are hidden when
  connected to it (they work in the mock room).
- **Quick messages** travel as plain chat text; the server can't tell them apart from typed chat.
- **Validation:** the server accepts any `furColor`, `eyeId` and `hatId` (unknown ones are drawn
  with the default look), any non-blank nickname length (name tags are cut at 24 characters), and any
  point inside 1920×1080 (the client keeps beavers on the walkable deck). The server should apply
  the rules in `appearance.ts`, `nickname.ts` and `freeText.ts`.

## Assets

Nothing external is needed: the beavers, faces, hats, props, room, logo and backdrops are original SVG
generated in code. If hand-drawn art replaces them later, the set is:

- Beaver body: 4 directions × 3 frames + blink
- 5 faces and 4 hats, each in 4 directions, aligned to the body canvas
- Room background, plus props: lantern, stump table, log bench, sign
- UI: logo, speech bubble, HUD icons
