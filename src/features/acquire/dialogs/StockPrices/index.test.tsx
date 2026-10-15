import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { GameSnapshot } from '../../model/session';
import { companyKeys } from '../../model/types';
import { StockPrices } from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});
afterEach(cleanup);

function priceSnapshot(): GameSnapshot {
  return {
    roomData: {
      companyInfo: Object.fromEntries(companyKeys.map(company => [company, {
        name: company,
        tiles: company === 'Tower' ? 8 : company === 'Sackson' ? 3 : 0,
        stockPrice: 600,
        stockTotal: 25,
      }])),
    },
  } as unknown as GameSnapshot;
}

describe('StockPrices', () => {
  it('highlights every current size band in the selected tier', () => {
    render(<StockPrices data={priceSnapshot()} onClose={vi.fn()} />);

    const threeTileRow = screen.getByText('3').closest('tr');
    const sixToTenRow = screen.getByText('6–10').closest('tr');
    const inactiveRow = screen.getByText('5').closest('tr');

    expect(threeTileRow?.className).toContain('isCurrent');
    expect(sixToTenRow?.className).toContain('isCurrent');
    expect(inactiveRow?.className).not.toContain('isCurrent');
    expect(screen.getByText('当前规模：Sackson 3 块 / Tower 8 块')).toBeTruthy();
  });
});
