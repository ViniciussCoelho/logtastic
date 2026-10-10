# Logtastic — MVP 0.1: The Dam

A cozy 2D social game: dress up a beaver, enter The Dam, walk around and chat with predefined messages.
This repo is the **frontend only**. The room server will be a separate Go service.

```bash
npm install
npm run dev        # http://localhost:5173 (uses the local mock room)
npm test           # Vitest
npm run build      # typecheck + production build
```

To use the real server instead of the mock, set `VITE_ROOM_URL` (for example `ws://localhost:8080/rooms/dam`).

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
    protocol.ts             Wire contract with the Go server + validation of server events
    roomConnection.ts       Picks the WebSocket connection or the mock
    websocketRoomConnection.ts
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

## Protocol (for the Go backend)

JSON objects discriminated by `type` (see `src/services/protocol.ts`).

| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `join` | `nickname`, `appearance { fur, face, hat }` |
| client → server | `move` | `target { x, y }` (world pixels, 1920×1080 room) |
| client → server | `chat` | `messageId` (never free text) |
| server → client | `welcome` | `selfId`, `players[]` (`id`, `nickname`, `appearance`, `position`) |
| server → client | `player_joined` | `player` |
| server → client | `player_left` | `playerId` |
| server → client | `player_moved` | `playerId`, `target` |
| server → client | `chat` | `playerId`, `messageId` (also echoed to the sender) |

Notes for the server:

- **Validate IDs.** Check `messageId` against the 12 IDs in `src/features/chat/messages.ts`, and check
  appearance against the IDs in `src/features/character/appearance.ts`.
- **Nickname rules.** 2–16 characters: letters, numbers, spaces, `-` and `_`.
- **Malformed events.** The client already drops any server event that fails validation.

## Assets

Nothing external is needed: the beavers, faces, hats, props, room, logo and backdrops are original SVG
generated in code. If hand-drawn art replaces them later, the set is:

- Beaver body: 4 directions × 3 frames + blink
- 5 faces and 4 hats, each in 4 directions, aligned to the body canvas
- Room background, plus props: lantern, stump table, log bench, sign
- UI: logo, speech bubble, HUD icons
