import { useEffect, useRef } from 'react';
export enum AudioTypeEnum {
  Quickily = 'quickily',
  Quickily1 = 'quickily1',
  Quickily2 = 'quickily2',
  YourTurn = 'your-turn',
  CreateCompany = 'create-company',
  BuyStock = 'buy-stock',
  GetNobleCard = 'get-noble-card',
}
const audioTypes: AudioTypeEnum[] = [
  AudioTypeEnum.Quickily,
  AudioTypeEnum.Quickily2,
  AudioTypeEnum.Quickily1,
  AudioTypeEnum.YourTurn,
  AudioTypeEnum.CreateCompany,
  AudioTypeEnum.BuyStock,
  AudioTypeEnum.GetNobleCard,
];

export const useAudio = () => {
  const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
  useEffect(() => {
    const map: Record<string, HTMLAudioElement> = {};
    audioTypes.forEach(type => {
      const audio = new Audio(`/music/${type}.mp3`);
      audio.load();
      map[type] = audio;
    });
    audioMapRef.current = map;
  }, []);

  const playAudio = (type: string) => {
    const audio = audioMapRef.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err: any) => {
        console.warn('音效播放失败（可能是用户未交互）', err);
      });
    }
  };

  return { audioMap: audioMapRef.current, playAudio };
};
