import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ActionButton } from './index';

afterEach(cleanup);

describe('ActionButton', () => {
  it('keeps its content mounted while pending and overlays the spinner', () => {
    const view = render(<ActionButton>创建并入座</ActionButton>);
    const button = screen.getByRole('button', { name: '创建并入座' }) as HTMLButtonElement;
    const label = screen.getByText('创建并入座');

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.querySelector('[aria-hidden="true"]')).toBeNull();

    view.rerender(<ActionButton pending>创建并入座</ActionButton>);

    expect(screen.getByText('创建并入座')).toBe(label);
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
