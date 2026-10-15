import { describe, expect, it } from 'vitest';
import { encodeClientEvent, parseWireEvent } from './serverWire';

const wire = (type: string, payload: unknown) => JSON.stringify({ type, payload });
const serverPlayer = { id: 'a1', nickname: 'Maple', furColor: 'cream', eyeId: 'wink', hatId: 'beanie', x: 900, y: 600 };
const roomPlayer = {
  id: 'a1',
  nickname: 'Maple',
  appearance: { fur: 'cream', face: 'wink', hat: 'beanie' },
  position: { x: 900, y: 600 },
};

describe('parseWireEvent', () => {
  it('reads every server event the Go server sends', () => {
    expect(parseWireEvent(wire('player_joined', serverPlayer))).toEqual({ type: 'player_joined', player: roomPlayer });
    expect(parseWireEvent(wire('player_entered', serverPlayer))).toEqual({ type: 'player_entered', player: roomPlayer });
    expect(parseWireEvent(wire('room_state', [serverPlayer]))).toEqual({ type: 'room_state', players: [roomPlayer] });
    expect(parseWireEvent(wire('room_state', []))).toEqual({ type: 'room_state', players: [] });
    expect(parseWireEvent(wire('player_left', { id: 'a1' }))).toEqual({ type: 'player_left', id: 'a1' });
    expect(parseWireEvent(wire('player_moved', { id: 'a1', x: 150, y: 250 }))).toEqual({
      type: 'player_moved',
      id: 'a1',
      position: { x: 150, y: 250 },
    });
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', nickname: 'Maple', text: 'Hello!' }))).toEqual({
      type: 'chat_received',
      playerId: 'a1',
      text: 'Hello!',
    });
  });

  it('keeps players with unknown looks, falling back per field', () => {
    const event = parseWireEvent(wire('player_entered', { ...serverPlayer, furColor: 'brown', eyeId: 'eyes_01' }));
    expect(event).toMatchObject({ player: { appearance: { fur: 'classic-brown', face: 'dots', hat: 'beanie' } } });
  });

  it('drops only the broken players from the room state', () => {
    const event = parseWireEvent(wire('room_state', [serverPlayer, { ...serverPlayer, id: 'b2', x: 'left' }, { id: 'c3' }]));
    expect(event).toEqual({ type: 'room_state', players: [roomPlayer] });
  });

  it('cleans nicknames the server did not validate', () => {
    const event = parseWireEvent(wire('player_entered', { ...serverPlayer, nickname: '  Bad\u0000ger‮ '.padEnd(60, 'x') }));
    expect(event).toMatchObject({ player: { nickname: 'Badger xxxxxxxxxxxxxxxxx' } });
    expect(parseWireEvent(wire('player_entered', { ...serverPlayer, nickname: '   ' }))).toBeNull();
  });

  it('keeps chat text verbatim (it is never treated as HTML) within the server limit', () => {
    const html = '<img src=x onerror=alert(1)>';
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', text: html }))).toMatchObject({ text: html });
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', text: '  oi   gente ' }))).toMatchObject({ text: 'oi gente' });
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', text: '🦫'.repeat(200) }))).not.toBeNull();
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', text: '🦫'.repeat(201) }))).toBeNull();
    expect(parseWireEvent(wire('chat_received', { playerId: 'a1', text: '   ' }))).toBeNull();
  });

  it('ignores malformed and unknown messages', () => {
    expect(parseWireEvent('not json')).toBeNull();
    expect(parseWireEvent(wire('teleport', { id: 'a1' }))).toBeNull();
    expect(parseWireEvent(wire('player_moved', { id: 'a1', x: null, y: 3 }))).toBeNull();
    expect(parseWireEvent(wire('player_left', {}))).toBeNull();
    expect(parseWireEvent(JSON.stringify({ type: 'player_left', id: 'a1' }))).toBeNull();
  });
});

describe('encodeClientEvent', () => {
  it('speaks the server envelope', () => {
    expect(JSON.parse(encodeClientEvent({ type: 'join', nickname: 'Woody', appearance: { fur: 'cream', face: 'happy', hat: 'none' } })!)).toEqual({
      type: 'player_join',
      payload: { nickname: 'Woody', furColor: 'cream', eyeId: 'happy', hatId: 'none' },
    });
    expect(JSON.parse(encodeClientEvent({ type: 'move', target: { x: 150, y: 250 } })!)).toEqual({
      type: 'player_move',
      payload: { x: 150, y: 250 },
    });
    expect(JSON.parse(encodeClientEvent({ type: 'say', text: 'Hello, Bucky!' })!)).toEqual({
      type: 'chat_send',
      payload: { text: 'Hello, Bucky!' },
    });
  });

  it('sends predefined messages as their text, and has nothing to send for emotes', () => {
    expect(JSON.parse(encodeClientEvent({ type: 'chat', messageId: 'social.nice-hat' })!)).toEqual({
      type: 'chat_send',
      payload: { text: 'Nice hat!' },
    });
    expect(encodeClientEvent({ type: 'emote', emoteId: 'party' })).toBeNull();
  });
});
