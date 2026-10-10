import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatMenu } from './ChatMenu';

describe('ChatMenu', () => {
  it('sends the ID of the picked message and closes', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatMenu onSend={onSend} />);

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    await user.click(screen.getByRole('tab', { name: 'Social' }));
    await user.click(screen.getByRole('button', { name: 'Nice hat!' }));

    expect(onSend).toHaveBeenCalledWith('social.nice-hat');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts on greetings and closes on Escape without sending', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatMenu onSend={onSend} />);

    await user.click(screen.getByRole('button', { name: 'Chat' }));
    expect(screen.getByRole('tab', { name: 'Greetings' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Hello!' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });
});
