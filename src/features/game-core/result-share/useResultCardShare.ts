import { useCallback, useEffect, useRef, useState } from 'react';
import { getFontEmbedCSS, toBlob } from 'html-to-image';
import type { GameType } from '@/hooks/useGameType';
import { getResultCard } from './api';
import { resultImageFilename } from './format';
import type { ResultCardModel } from './model';
import { preloadResultCardArtwork, resultCardTheme } from './themes';

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

interface BlobTask {
  key: string;
  promise: Promise<Blob>;
}

interface ModelCache {
  key: string;
  model: ResultCardModel;
}

let resultCardFontCSS: Promise<string> | undefined;
let resultCardModelCache: ModelCache | undefined;
let resultCardBlobCache: BlobCache | undefined;
let resultCardBlobTask: BlobTask | undefined;

export function warmResultCardFonts(node: HTMLElement): Promise<string> {
  if (!resultCardFontCSS) {
    resultCardFontCSS = getFontEmbedCSS(node).catch(reason => {
      resultCardFontCSS = undefined;
      throw reason;
    });
  }
  return resultCardFontCSS;
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

async function waitForResultCardImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll('img'))
    .filter(image => !image.hidden);
  await Promise.all(images.map(async image => {
    if (!image.complete) {
      await new Promise<void>(resolve => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    }
    if (typeof image.decode === 'function') {
      await image.decode().catch(() => undefined);
    }
  }));
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
  const [imageReady, setImageReady] = useState(false);
  const [imagePreparing, setImagePreparing] = useState(false);
  const requestIDRef = useRef(0);
  const abortRef = useRef<AbortController>();

  const load = useCallback(async () => {
    const requestID = ++requestIDRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const modelKey = `${gameType}:${matchID}`;
    setImageReady(false);
    setImagePreparing(false);
    setStatus('loading');
    setError('');
    try {
      const next = resultCardModelCache?.key === modelKey
        ? resultCardModelCache.model
        : await getResultCard(gameType, matchID, controller.signal);
      if (requestID !== requestIDRef.current) return;
      resultCardModelCache = { key: modelKey, model: next };
      setModel(next);
      setImageReady(
        resultCardBlobCache?.key === `${modelKey}:${next.endedAt}`,
      );
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
    abortRef.current?.abort();
  }, []);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => {
    requestIDRef.current++;
    abortRef.current?.abort();
    setImageReady(false);
    setImagePreparing(false);
    setVisible(false);
    setModel(undefined);
    setError('');
    setStatus('closed');
  }, []);

  const generateBlob = useCallback(async (node: HTMLElement) => {
    if (!model) throw new Error('战绩卡片尚未准备完成');
    const cacheKey = `${gameType}:${matchID}:${model.endedAt}`;
    if (resultCardBlobCache?.key === cacheKey) {
      return resultCardBlobCache.blob;
    }
    if (resultCardBlobTask?.key === cacheKey) {
      return resultCardBlobTask.promise;
    }
    const promise = (async () => {
      const [fontEmbedCSS] = await Promise.all([
        warmResultCardFonts(node),
        preloadResultCardArtwork(gameType),
        waitForResultCardImages(node),
      ]);
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve()));
      const blob = await toBlob(node, {
        pixelRatio: 2,
        width: 540,
        height: 720,
        backgroundColor: resultCardTheme(gameType).paper,
        fontEmbedCSS,
      });
      if (!blob) throw new Error('浏览器未能生成战绩图片');
      resultCardBlobCache = { key: cacheKey, blob };
      return blob;
    })();
    resultCardBlobTask = { key: cacheKey, promise };
    try {
      return await promise;
    } finally {
      if (resultCardBlobTask?.promise === promise) {
        resultCardBlobTask = undefined;
      }
    }
  }, [gameType, matchID, model]);

  const prepare = useCallback(async (node: HTMLElement) => {
    if (!model || imageReady) return;
    setImagePreparing(true);
    setError('');
    try {
      await generateBlob(node);
      setImageReady(true);
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setStatus('error');
      setError(reason instanceof Error ? reason.message : '战绩图片生成失败');
    } finally {
      setImagePreparing(false);
    }
  }, [generateBlob, imageReady, model]);

  const save = useCallback(async (node: HTMLElement) => {
    if (!model) return;
    try {
      setStatus('exporting');
      const blob = await generateBlob(node);
      setImageReady(true);
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

  const share = useCallback((node: HTMLElement) => {
    if (!model || !supportsFileShare()) return;
    const cacheKey = `${gameType}:${matchID}:${model.endedAt}`;
    const blob = resultCardBlobCache?.key === cacheKey
      ? resultCardBlobCache.blob
      : undefined;
    if (!blob) {
      void prepare(node);
      return;
    }
    const file = new File(
      [blob],
      resultImageFilename(gameType, model.self.displayName, model.endedAt),
      { type: 'image/png' },
    );
    setStatus('sharing');
    try {
      const sharing = navigator.share({
        files: [file],
        title: `${resultCardTheme(gameType).title}战绩`,
        text: '来 GameBus 再开一局',
      });
      void sharing.then(() => setStatus('ready')).catch(reason => {
        if (
          reason instanceof DOMException
          && (reason.name === 'AbortError' || reason.name === 'NotAllowedError')
        ) {
          setStatus('ready');
          return;
        }
        setStatus('error');
        setError(reason instanceof Error ? reason.message : '战绩图片分享失败');
      });
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
  }, [gameType, matchID, model, prepare]);

  return {
    visible,
    status,
    model,
    error,
    imageReady,
    imagePreparing,
    fileShareSupported: supportsFileShare(),
    open,
    close,
    retry: load,
    preload: load,
    prepare,
    save,
    share,
  };
}
