import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerAvatar } from './Shell';

describe('War Chest PlayerAvatar', () => {
  it('renders a bot fallback for AI players without changing the raw name', () => {
    const { container } = render(
      <PlayerAvatar name="渡鸦" ai size={40} />,
    );

    expect(container.querySelector('.lucide-bot')).toBeTruthy();
    expect(screen.queryByText('渡')).toBeNull();
  });

  it('keeps the themed initial fallback for human players', () => {
    render(<PlayerAvatar name="Alice" size={40} />);
    expect(screen.getByText('A')).toBeTruthy();
  });
});
