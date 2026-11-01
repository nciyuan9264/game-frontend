import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ResponsiveDialog } from '.';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(cleanup);

describe('ResponsiveDialog', () => {
  it('keeps nondismissible dialogs open when cancel is requested', () => {
    const onClose = vi.fn();
    render(<ResponsiveDialog title="公开出牌" onClose={onClose}
      dismissible={false}>所有玩家的牌</ResponsiveDialog>);

    const dialog = screen.getByRole('dialog');
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(screen.queryByRole('button', { name: '关闭面板' })).toBeNull();

    fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('preserves the default close controls', () => {
    const onClose = vi.fn();
    render(<ResponsiveDialog title="普通面板" onClose={onClose}>
      面板内容
    </ResponsiveDialog>);

    fireEvent.click(screen.getByRole('button', { name: '关闭面板' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent(screen.getByRole('dialog'), new Event('cancel', {
      cancelable: true,
    }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
