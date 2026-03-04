import { useState, useCallback } from 'react';
import PlaceTileConfirm from '../components/PlaceTileConfirm';

export const useGameOperate = (sendMessage: (message: string) => void) => {
  const [visible, setVisible] = useState(false);
  const [tileKey, setTileKey] = useState<string>('');

  const placeTile = useCallback((key: string) => {
    setTileKey(key);
    setVisible(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      sendMessage(
        JSON.stringify({
          type: 'game_place_tile',
          payload: { tileKey },
        })
      );
    }, 300);
  }, [sendMessage, tileKey]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const PlaceTileConfirmModal = (
    <PlaceTileConfirm
      visible={visible}
      onClose={handleClose}
      onConfirm={handleConfirm}
      tileKey={tileKey}
    />
  );

  return { placeTile, PlaceTileConfirmModal };
}



