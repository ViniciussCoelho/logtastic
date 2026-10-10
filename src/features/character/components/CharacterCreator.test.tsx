import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CharacterCreator } from './CharacterCreator';

function setup() {
  const onEnter = vi.fn();
  render(<CharacterCreator onEnter={onEnter} />);
  return { onEnter, user: userEvent.setup() };
}

describe('CharacterCreator', () => {
  it('starts as a classic brown beaver without a hat', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Classic Brown' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'No hat' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dots' })).toBeChecked();
    expect(screen.getByRole('img', { name: /classic brown fur, dots face, no hat/i })).toBeInTheDocument();
  });

  it('updates the live preview as fur and hat change', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Ash Gray' }));
    await user.click(screen.getByRole('radio', { name: 'Cool' }));
    await user.click(screen.getByRole('radio', { name: 'Explorer hat' }));
    expect(screen.getByRole('img', { name: /ash gray fur, cool face, explorer hat/i })).toBeInTheDocument();
  });

  it('enters The Dam with the chosen nickname and outfit', async () => {
    const { user, onEnter } = setup();
    await user.type(screen.getByLabelText('Nickname'), '  Chip  ');
    await user.click(screen.getByRole('radio', { name: 'Golden Brown' }));
    await user.click(screen.getByRole('radio', { name: 'Wink' }));
    await user.click(screen.getByRole('radio', { name: 'Straw hat' }));
    await user.click(screen.getByRole('button', { name: 'Enter The Dam' }));

    expect(onEnter).toHaveBeenCalledWith({
      nickname: 'Chip',
      appearance: { fur: 'golden-brown', face: 'wink', hat: 'straw-hat' },
    });
  });

  it('blocks entry and explains why when the nickname is missing', async () => {
    const { user, onEnter } = setup();
    expect(screen.queryByText(/pick a nickname/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enter The Dam' }));

    expect(onEnter).not.toHaveBeenCalled();
    expect(screen.getByText(/pick a nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Nickname')).toHaveFocus();
    expect(screen.getByLabelText('Nickname')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows feedback while typing an invalid nickname', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Nickname'), 'Log$');
    expect(screen.getByText(/only letters, numbers/i)).toBeInTheDocument();
  });

  it('caps the nickname at 16 characters', async () => {
    const { user } = setup();
    const input = screen.getByLabelText('Nickname');
    await user.type(input, 'abcdefghijklmnopqrstu');
    expect(input).toHaveValue('abcdefghijklmnop');
  });

  it('restores the beaver from the last visit', () => {
    render(
      <CharacterCreator
        onEnter={vi.fn()}
        initialProfile={{ nickname: 'Pip', appearance: { fur: 'cream', face: 'happy', hat: 'beanie' } }}
      />,
    );
    expect(screen.getByLabelText('Nickname')).toHaveValue('Pip');
    expect(screen.getByRole('radio', { name: 'Cream' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Happy' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beanie' })).toBeChecked();
  });
});
