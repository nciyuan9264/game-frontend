export const playAudio = (audioMapRef: React.MutableRefObject<Record<string, HTMLAudioElement>>, type: string) => {
  const audio = audioMapRef.current[type];
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch((err: any) => {
      console.warn('音效播放失败（可能是用户未交互）', err);
    });
  }
};
