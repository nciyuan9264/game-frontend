import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameAvatar } from '.';

describe('GameAvatar', () => {
  it('renders a real image without invoking the fallback', () => {
    const renderFallback = vi.fn(() => <b>AB</b>);
    const { container } = render(<GameAvatar
      name="Alice"
      avatar="https://example.com/avatar.png"
      renderFallback={renderFallback}
    />);
    const image = container.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://example.com/avatar.png');
    expect(image?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(renderFallback).not.toHaveBeenCalled();
  });

  it('passes identity and size to the branded fallback', () => {
    render(<GameAvatar
      name="Alice"
      ai
      size={48}
      renderFallback={({ name, ai, size }) => <b>{`${name}:${ai}:${size}`}</b>}
    />);
    expect(screen.getByText('Alice:true:48')).toBeTruthy();
  });
});
