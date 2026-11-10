import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import {
  GetAcquisitionSurvey,
  SubmitAcquisitionSurvey,
} from '@/api/generated/auth';
import { AcquisitionSurveyPrompt } from './AcquisitionSurveyPrompt';

vi.mock('@/api/generated/auth', () => ({
  GetAcquisitionSurvey: vi.fn(),
  SubmitAcquisitionSurvey: vi.fn(),
}));

const options = [
  { value: 'friend', label: '朋友推荐' },
  { value: 'bilibili', label: '哔哩哔哩' },
  { value: 'other', label: '其他' },
];

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(cleanup);

describe('AcquisitionSurveyPrompt', () => {
  it('loads unanswered survey and submits one selected source', async () => {
    vi.mocked(GetAcquisitionSurvey).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: { completed: false, options },
    });
    vi.mocked(SubmitAcquisitionSurvey).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: { completed: true, source: 'friend', options },
    });

    render(<MemoryRouter initialEntries={['/game/acquire']}>
      <AcquisitionSurveyPrompt />
    </MemoryRouter>);

    expect(await screen.findByText('你是从哪里知道 GameBus 的？')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '关闭面板' })).toBeNull();
    const submit = screen.getByRole('button', { name: '提交' });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByText('朋友推荐'));
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(SubmitAcquisitionSurvey).toHaveBeenCalledWith(
      { source: 'friend' },
      { suppressAuthRedirect: true },
    ));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('requires a detail when other is selected', async () => {
    vi.mocked(GetAcquisitionSurvey).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: { completed: false, options },
    });
    vi.mocked(SubmitAcquisitionSurvey).mockResolvedValue({
      status_code: 200,
      message: 'ok',
      data: {
        completed: true,
        source: 'other',
        other_detail: '线下桌游店',
        options,
      },
    });

    render(<MemoryRouter initialEntries={['/']}>
      <AcquisitionSurveyPrompt />
    </MemoryRouter>);

    await screen.findByRole('dialog');
    fireEvent.click(screen.getByText('其他'));
    const submit = screen.getByRole('button', { name: '提交' });
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByRole('textbox', { name: '请补充说明' }), {
      target: { value: '  线下桌游店  ' },
    });
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(SubmitAcquisitionSurvey).toHaveBeenCalledWith(
      { source: 'other', other_detail: '线下桌游店' },
      { suppressAuthRedirect: true },
    ));
  });

  it('does not load on admin routes', async () => {
    render(<MemoryRouter initialEntries={['/admin/overview']}>
      <AcquisitionSurveyPrompt />
    </MemoryRouter>);

    await waitFor(() => expect(GetAcquisitionSurvey).not.toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
