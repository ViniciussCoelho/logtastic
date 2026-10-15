import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionNotice } from './ConnectionNotice';

describe('ConnectionNotice', () => {
  it('tells the player what happened and takes them back', async () => {
    const onBack = vi.fn<() => void>();
    const { rerender } = render(<ConnectionNotice reason="unreachable" onBack={onBack} />);
    expect(screen.getByRole('alertdialog', { name: "Couldn't reach The Dam" })).toBeInTheDocument();

    rerender(<ConnectionNotice reason="lost" onBack={onBack} />);
    expect(screen.getByRole('alertdialog', { name: 'Lost connection to The Dam' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Back to my beaver' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
