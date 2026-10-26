import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GameShareContent } from '.';

afterEach(cleanup);

describe('GameShareContent', () => {
  it('renders a QR code, fixed address, and scan guidance', () => {
    const { container } = render(<GameShareContent
      url="https://board.gamebus.online/game/test"
      color="#111111"
      background="#ffffff"
      classes={{ root: 'root', qr: 'qr', address: 'address', hint: 'hint' }}
    />);

    expect(container.querySelector('.qr svg')).toBeTruthy();
    expect(screen.getByText('https://board.gamebus.online/game/test')).toBeTruthy();
    expect(screen.getByText(/朋友可以扫码进入大厅/)).toBeTruthy();
  });
});
