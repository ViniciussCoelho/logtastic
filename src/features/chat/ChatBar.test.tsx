import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatBar } from './ChatBar';
import type { ChatLogEntry } from './chatLog';
import type { EmoteId } from './emotes';
import type { ChatMessageId } from './messages';

function setup({ entries = [] as ChatLogEntry[], accepted = true, emotesEnabled = true } = {}) {
  const props = {
    fur: 'classic-brown' as const,
    entries,
    selfId: 'me',
    onSendPreset: vi.fn<(messageId: ChatMessageId) => boolean>(() => accepted),
    onSendText: vi.fn<(text: string) => boolean>(() => accepted),
    onSendEmote: vi.fn<(emoteId: EmoteId) => boolean>(() => accepted),
    emotesEnabled,
  };
  const view = render(<ChatBar {...props} />);
  return { props, view, user: userEvent.setup(), input: screen.getByLabelText('Type a message') };
}

describe('ChatBar', () => {
  it('sends a typed message with Enter and clears the input', async () => {
    const { props, user, input } = setup();
    await user.type(input, '  oi   galera {Enter}');
    expect(props.onSendText).toHaveBeenCalledWith('oi galera');
    expect(input).toHaveValue('');
  });

  it('does not send blank messages', async () => {
    const { props, user, input } = setup();
    await user.type(input, '   {Enter}');
    expect(props.onSendText).not.toHaveBeenCalled();
  });

  it('keeps the draft and says why when a message is refused', async () => {
    const { user, input } = setup({ accepted: false });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.type(input, 'too fast{Enter}');
    expect(input).toHaveValue('too fast');
    expect(screen.getByRole('status')).toHaveTextContent(/busy beaver/i);
  });

  it('brings back the last sent message with the up arrow', async () => {
    const { user, input } = setup();
    await user.type(input, 'nice hat!{Enter}');
    await user.type(input, '{ArrowUp}');
    expect(input).toHaveValue('nice hat!');
  });

  it('jumps into the message field with Enter, and leaves it with Escape', async () => {
    const { user, input } = setup();
    await user.keyboard('{Enter}');
    expect(input).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(input).not.toHaveFocus();
  });

  it('sends emotes with number keys, but not while typing', async () => {
    const { props, user, input } = setup();
    await user.keyboard('8');
    expect(props.onSendEmote).toHaveBeenCalledWith('party');

    await user.type(input, '8');
    expect(props.onSendEmote).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('8');
  });

  it('drops the emote menu and keys when the room cannot relay emotes', async () => {
    const { props, user } = setup({ emotesEnabled: false });
    expect(screen.queryByRole('button', { name: 'Emotes' })).not.toBeInTheDocument();
    await user.keyboard('8');
    expect(props.onSendEmote).not.toHaveBeenCalled();
  });

  it('counts characters only as the limit gets close', async () => {
    const { user, input } = setup();
    await user.type(input, 'a'.repeat(59));
    expect(screen.queryByText('59/80')).not.toBeInTheDocument();
    await user.type(input, 'a');
    expect(screen.getByText('60/80')).toBeInTheDocument();
  });

  it('sends the ID of the picked emote', async () => {
    const { props, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Emotes' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Emotes' })).getByRole('button', { name: 'Party' }));
    expect(props.onSendEmote).toHaveBeenCalledWith('party');
  });

  it('flags unread lines and shows them in the history', async () => {
    const { props, view, user } = setup();
    view.rerender(
      <ChatBar
        {...props}
        entries={[
          { key: 0, playerId: 'p1', nickname: 'Maple', kind: 'text', text: 'Hello!' },
          { key: 1, playerId: 'p1', nickname: 'Maple', kind: 'emote', emoteId: 'wave', fur: 'cream' },
        ]}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /chat history/i }));
    const history = screen.getByRole('region', { name: 'Chat history' });
    expect(within(history).getByText('Hello!')).toBeInTheDocument();
    expect(within(history).getByRole('img', { name: /waving/i })).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });
});
