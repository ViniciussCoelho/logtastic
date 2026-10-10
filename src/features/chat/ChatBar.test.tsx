import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatBar } from './ChatBar';
import type { ChatLogEntry } from './chatLog';

function setup({ entries = [] as ChatLogEntry[], textAccepted = true } = {}) {
  const props = {
    fur: 'classic-brown' as const,
    entries,
    selfId: 'me',
    onSendPreset: vi.fn(),
    onSendText: vi.fn(() => textAccepted),
    onSendEmote: vi.fn(),
  };
  const view = render(<ChatBar {...props} />);
  return { props, view, user: userEvent.setup() };
}

describe('ChatBar', () => {
  it('sends a typed message with Enter and clears the input', async () => {
    const { props, user } = setup();
    const input = screen.getByLabelText('Type a message');
    await user.type(input, '  oi   galera {Enter}');
    expect(props.onSendText).toHaveBeenCalledWith('oi galera');
    expect(input).toHaveValue('');
  });

  it('keeps the draft when the message is not sent', async () => {
    const { props, user } = setup({ textAccepted: false });
    const input = screen.getByLabelText('Type a message');
    await user.type(input, 'too fast{Enter}');
    expect(props.onSendText).toHaveBeenCalled();
    expect(input).toHaveValue('too fast');
  });

  it('does not send blank messages', async () => {
    const { props, user } = setup();
    await user.type(screen.getByLabelText('Type a message'), '   {Enter}');
    expect(props.onSendText).not.toHaveBeenCalled();
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
