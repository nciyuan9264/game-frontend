import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CardActionDialog } from './CardAction';
import { CollectionDialog } from './Collection';
import { ReturnTokensDialog } from './ReturnTokens';
import type { DevelopmentCard, GemCounts, PlayerState } from '../model/types';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

const card: DevelopmentCard = {
  id: 1,
  level: 1,
  bonus: 'Blue',
  points: 0,
  cost: { Red: 1 },
  state: 1,
};
const player: PlayerState = {
  normalCard: [],
  nobleCard: [],
  reserveCard: [],
  gem: { Red: 1 },
  score: 0,
};

describe('Splendor action dialogs', () => {
  it('shows reserve and buy for a public card, but only buy for an owned reserve', () => {
    const props = {
      card,
      player,
      goldAvailable: true,
      interactive: true,
      reserveAllowed: true,
      onClose: vi.fn(),
      onBuy: vi.fn(),
      onReserve: vi.fn(),
    };
    const { rerender } = render(<CardActionDialog {...props} fromReserve={false} />);
    expect((screen.getByRole('button', { name: '预留此卡' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: '购买发展卡' }) as HTMLButtonElement).disabled).toBe(false);
    rerender(<CardActionDialog {...props} fromReserve />);
    expect(screen.queryByRole('button', { name: '预留此卡' })).toBeNull();
    expect((screen.getByRole('button', { name: '购买发展卡' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('does not label a zero-payment shortage as a free purchase', () => {
    render(<CardActionDialog card={{ ...card, cost: { Blue: 2 } }} player={{ ...player, gem: {} }}
      goldAvailable interactive reserveAllowed fromReserve={false}
      onClose={vi.fn()} onBuy={vi.fn()} onReserve={vi.fn()} />);
    expect(screen.queryByText('免费购入')).toBeNull();
    expect(screen.getByText(/还缺 2 枚筹码/)).not.toBeNull();
  });

  it('requires an exact return selection before confirming', () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    function Harness() {
      const [returns, setReturns] = useState<GemCounts>({});
      return <ReturnTokensDialog
        wallet={{ White: 0, Blue: 0, Green: 0, Red: 10, Black: 0, Gold: 1 }}
        returns={returns}
        onChange={setReturns}
        onCancel={cancel}
        onConfirm={confirm}
      />;
    }
    render(<Harness />);
    const confirmButton = screen.getByRole('button', { name: '确认退还并完成回合' });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '返回选择' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '退还黄金' }));
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirmButton);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('never renders an opponent reserved card face', () => {
    render(<CollectionDialog name="对手" player={{ ...player, reserveCard: [card] }} isSelf={false}
      onClose={vi.fn()} onCard={vi.fn()} onNoble={vi.fn()} />);
    expect(screen.getByTestId('hidden-reserved-cards').textContent).toContain('1 张预留卡');
    expect(screen.queryByTestId('own-reserved-cards')).toBeNull();
    expect(screen.queryByRole('button', { name: /查看.*发展卡/ })).toBeNull();
  });
});
