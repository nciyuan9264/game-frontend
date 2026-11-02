import { useCallback, useEffect, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import type { GameType } from '@/hooks/useGameType';
import { getResultCard } from './api';
import { resultImageFilename } from './format';
import type { ResultCardModel } from './model';
import { resultCardTheme } from './themes';

type ShareStatus =
  | 'closed'
  | 'loading'
  | 'ready'
  | 'exporting'
  | 'sharing'
  | 'error';

interface BlobCache {
  key: string;
  blob: Blob;
}

function abortError(): DOMException {
  return new DOMException('Operation aborted', 'AbortError');
}

export function supportsFileShare(): boolean {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([''], 'result.png', { type: 'image/png' })],
    });
  } catch {
    return false;
  }
}

export function useResultCardShare({
  gameType,
  matchID,
}: {
  gameType: GameType;
  matchID: string;
}) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<ShareStatus>('closed');
  const [model, setModel] = useState<ResultCardModel>();
  const [error, setError] = useState('');
  const requestIDRef = useRef(0);
  const operationIDRef = useRef(0);
  const abortRef = useRef<AbortController>();
  const blobCacheRef = useRef<BlobCache>();

  const load = useCallback(async () => {
    const requestID = ++requestIDRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    blobCacheRef.current = undefined;
    setStatus('loading');
    setError('');
    try {
      const next = await getResultCard(gameType, matchID, controller.signal);
      if (requestID !== requestIDRef.current) return;
      setModel(next);
      setStatus('ready');
    } catch (reason) {
      if (
        requestID !== requestIDRef.current
        || reason instanceof DOMException && reason.name === 'AbortError'
      ) return;
      setModel(undefined);
      setStatus('error');
      setError(reason instanceof Error ? reason.message : '战绩卡片加载失败');
    }
  }, [gameType, matchID]);

  useEffect(() => {
    if (!visible) return;
    void load();
    return () => abortRef.current?.abort();
  }, [load, visible]);

  useEffect(() => () => {
    requestIDRef.current++;
    operationIDRef.current++;
    abortRef.current?.abort();
    blobCacheRef.current = undefined;
  }, []);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => {
    requestIDRef.current++;
    operationIDRef.current++;
    abortRef.current?.abort();
    blobCacheRef.current = undefined;
    setVisible(false);
    setModel(undefined);
    setError('');
    setStatus('closed');
  }, []);

  const generateBlob = useCallback(async (
    node: HTMLElement,
    actionStatus: 'exporting' | 'sharing',
  ) => {
    if (!model) throw new Error('战绩卡片尚未准备完成');
    const cacheKey = `${gameType}:${matchID}:${model.endedAt}`;
    if (blobCacheRef.current?.key === cacheKey) {
      return blobCacheRef.current.blob;
    }
    const operationID = ++operationIDRef.current;
    setStatus(actionStatus);
    setError('');
    await document.fonts?.ready;
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => resolve()));
    if (operationID !== operationIDRef.current) throw abortError();
    const blob = await toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      width: 540,
      height: 720,
      backgroundColor: resultCardTheme(gameType).paper,
    });
    if (operationID !== operationIDRef.current) throw abortError();
    if (!blob) throw new Error('浏览器未能生成战绩图片');
    blobCacheRef.current = { key: cacheKey, blob };
    setStatus('ready');
    return blob;
  }, [gameType, matchID, model]);

  const save = useCallback(async (node: HTMLElement) => {
    if (!model) return;
    try {
      setStatus('exporting');
      const blob = await generateBlob(node, 'exporting');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resultImageFilename(
        gameType,
        model.self.displayName,
        model.endedAt,
      );
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus('ready');
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setStatus('error');
      setError(reason instanceof Error ? reason.message : '战绩图片保存失败');
    }
  }, [gameType, generateBlob, model]);

  const share = useCallback(async (node: HTMLElement) => {
    if (!model || !supportsFileShare()) return;
    try {
      setStatus('sharing');
      const blob = await generateBlob(node, 'sharing');
      const file = new File(
        [blob],
        resultImageFilename(gameType, model.self.displayName, model.endedAt),
        { type: 'image/png' },
      );
      await navigator.share({
        files: [file],
        title: `${resultCardTheme(gameType).title}战绩`,
        text: '来 GameBus 再开一局',
      });
      setStatus('ready');
    } catch (reason) {
      if (
        reason instanceof DOMException
        && (reason.name === 'AbortError' || reason.name === 'NotAllowedError')
      ) {
        setStatus('ready');
        return;
      }
      setStatus('error');
      setError(reason instanceof Error ? reason.message : '战绩图片分享失败');
    }
  }, [gameType, generateBlob, model]);

  return {
    visible,
    status,
    model,
    error,
    fileShareSupported: supportsFileShare(),
    open,
    close,
    retry: load,
    save,
    share,
  };
}
