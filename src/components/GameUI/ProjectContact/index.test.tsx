import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectContact } from '.';

afterEach(cleanup);

describe('ProjectContact', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('exposes author contact, repository, and legal information', async () => {
    render(<ProjectContact gameName="Test Game" avatar={<span>头像</span>}
      classes={{ intro: 'intro', links: 'links', legal: 'legal' }} />);

    fireEvent.click(screen.getByRole('button', { name: /QQ 联系作者/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('1522457543'));
    expect(screen.getByRole('button', { name: /QQ 已复制/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /查看项目源码/ }).getAttribute('href'))
      .toBe('https://github.com/nciyuan9264/game-frontend');
    expect(screen.getByText(/在线 Test Game 游戏/)).toBeTruthy();
    expect(screen.getByText(/非官方在线实现/)).toBeTruthy();
  });
});
