import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GetAcquisitionSurvey,
  SubmitAcquisitionSurvey,
  type AcquisitionSourceOption,
} from '@/api/generated/auth';

interface AcquisitionSurveyState {
  visible: boolean;
  options: AcquisitionSourceOption[];
  selectedSource: string;
  otherDetail: string;
  submitting: boolean;
  error: string;
}

const initialState: AcquisitionSurveyState = {
  visible: false,
  options: [],
  selectedSource: '',
  otherDetail: '',
  submitting: false,
  error: '',
};

export function useAcquisitionSurvey(enabled: boolean) {
  const requestID = useRef(0);
  const [state, setState] = useState<AcquisitionSurveyState>(initialState);

  useEffect(() => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    const currentRequestID = ++requestID.current;
    GetAcquisitionSurvey({ suppressAuthRedirect: true })
      .then(response => {
        if (currentRequestID !== requestID.current) return;
        if (response.data.completed || response.data.options.length === 0) {
          setState(initialState);
          return;
        }
        setState({
          visible: true,
          options: response.data.options,
          selectedSource: '',
          otherDetail: '',
          submitting: false,
          error: '',
        });
      })
      .catch(() => {
        if (currentRequestID === requestID.current) setState(initialState);
      });

    return () => {
      if (currentRequestID === requestID.current) requestID.current += 1;
    };
  }, [enabled]);

  const selectSource = useCallback((selectedSource: string) => {
    setState(current => ({
      ...current,
      selectedSource,
      otherDetail: selectedSource === 'other' ? current.otherDetail : '',
      error: '',
    }));
  }, []);

  const updateOtherDetail = useCallback((otherDetail: string) => {
    setState(current => ({ ...current, otherDetail, error: '' }));
  }, []);

  const submit = useCallback(async () => {
    const otherDetail = state.otherDetail.trim();
    if (
      !state.selectedSource
      || state.submitting
      || (state.selectedSource === 'other' && !otherDetail)
    ) return;

    const currentRequestID = ++requestID.current;
    setState(current => ({ ...current, submitting: true, error: '' }));
    try {
      const response = await SubmitAcquisitionSurvey(
        {
          source: state.selectedSource,
          ...(state.selectedSource === 'other' ? { other_detail: otherDetail } : {}),
        },
        { suppressAuthRedirect: true },
      );
      if (currentRequestID !== requestID.current) return;
      if (response.data.completed) {
        setState(initialState);
        return;
      }
      setState(current => ({
        ...current,
        submitting: false,
        error: '提交未完成，请重试',
      }));
    } catch (error) {
      if (currentRequestID !== requestID.current) return;
      setState(current => ({
        ...current,
        submitting: false,
        error: error instanceof Error ? error.message : '提交失败，请稍后重试',
      }));
    }
  }, [state.otherDetail, state.selectedSource, state.submitting]);

  return {
    ...state,
    selectSource,
    updateOtherDetail,
    canSubmit: Boolean(state.selectedSource)
      && (state.selectedSource !== 'other' || state.otherDetail.trim().length > 0),
    submit,
  };
}
