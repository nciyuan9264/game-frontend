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

  it('preloads unique sound files and reuses them for playback', () => {
    const audios: Array<{
      preload: string;
      src: string;
      volume: number;
      currentTime: number;
      load: ReturnType<typeof vi.fn>;
      play: ReturnType<typeof vi.fn>;
    }> = [];
    const Audio = vi.fn(() => {
      const audio = {
        preload: '',
        src: '',
        volume: 0,
        currentTime: 0,
        load: vi.fn(),
        play: vi.fn().mockResolvedValue(undefined),
      };
      audios.push(audio);
      return audio;
    });
    vi.stubGlobal('navigator', { userAgent: 'browser' });
    vi.stubGlobal('Audio', Audio);

    render(<GameAudio />);
    playGameSound('ui-click');

    expect(Audio).toHaveBeenCalledTimes(7);
    expect(audios.map((audio) => audio.src)).toEqual([
      '/game-sounds/ui-click.mp3',
      '/game-sounds/button-click.mp3',
      '/game-sounds/tab-click.mp3',
      '/game-sounds/tile-select.mp3',
      '/game-sounds/tile-place.mp3',
      '/game-sounds/create-company.mp3',
      '/game-sounds/stock-buy.mp3',
    ]);
    expect(audios.every((audio) => audio.preload === 'auto')).toBe(true);
    expect(audios.every((audio) => audio.load.mock.calls.length === 1)).toBe(true);

    const audio = audios.find(({ src }) => src === '/game-sounds/ui-click.mp3')!;
    expect(audio.volume).toBe(0.3);
    expect(audio.play).toHaveBeenCalledOnce();
  });
});
