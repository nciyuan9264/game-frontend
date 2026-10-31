import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameAudio, playGameSound } from '.';

const click = (element: Element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, detail: 1 }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('GameAudio', () => {
  it('maps standard and semantic controls to sound names', () => {
    const soundPlayer = vi.fn();
    const { container } = render(<>
      <GameAudio soundPlayer={soundPlayer} />
      <button type="button" data-testid="button">button</button>
      <button type="button" role="tab" data-testid="tab">tab</button>
      <button type="button" data-click-sound="game-place" data-testid="place"><span>place</span></button>
    </>);

    click(container.querySelector('[data-testid="button"]')!);
    click(container.querySelector('[data-testid="tab"]')!);
    click(container.querySelector('[data-testid="place"] span')!);
    expect(soundPlayer.mock.calls.map(([sound]) => sound)).toEqual(['button-click', 'tab-click', 'game-place']);
  });

  it('ignores disabled, opted-out, keyboard, and secondary clicks', () => {
    const soundPlayer = vi.fn();
    const { container } = render(<>
      <GameAudio soundPlayer={soundPlayer} />
      <button type="button" disabled data-testid="disabled">disabled</button>
      <button type="button" data-click-sound="false" data-testid="silent">silent</button>
    </>);

    click(container.querySelector('[data-testid="disabled"]')!);
    click(container.querySelector('[data-testid="silent"]')!);
    container.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    container.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, button: 2 }));
    expect(soundPlayer).not.toHaveBeenCalled();
  });

  it('plays the background click sound at a reduced volume', () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const audio = { preload: '', volume: 0, currentTime: 0, play };
    const Audio = vi.fn(() => audio);
    vi.stubGlobal('navigator', { userAgent: 'browser' });
    vi.stubGlobal('Audio', Audio);

    playGameSound('ui-click');

    expect(Audio).toHaveBeenCalledWith('/game-sounds/ui-click.mp3');
    expect(audio.volume).toBe(0.3);
    expect(play).toHaveBeenCalledOnce();
  });
});
