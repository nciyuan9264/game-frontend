import styles from './index.module.less';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/Button';
import { CardColorType, SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { canGetGems, gemColors, GemColor } from '../../utils/game';
import GemToken from '../Card/GemToken';

interface GemSelectProps {
  data: SplendorWsRoomSyncData;
  sendMessage: (msg: string) => void;
  userID: string;
}

const GemSelect = ({ data, sendMessage, userID }: GemSelectProps) => {
  const [selectedGems, setSelectedGems] = useState<(CardColorType | null)[]>([null, null, null]);
  const [localGems, setLocalGems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data.roomData?.gems) {
      setLocalGems({ ...data.roomData.gems });
    }
  }, [data.roomData?.gems]);

  const isMyTurn = userID === data.roomData.currentPlayer;

  const handleClickGem = (color: CardColorType) => {
    if (selectedGems.filter(Boolean).length >= 3) return;
    if ((localGems[color] ?? 0) <= 0) return;

    const emptyIdx = selectedGems.findIndex((g) => g === null);
    if (emptyIdx === -1) return;

    const updated = [...selectedGems];
    updated[emptyIdx] = color;
    setSelectedGems(updated);
    setLocalGems((prev) => ({ ...prev, [color]: prev[color] - 1 }));
  };

  const handleRemoveGem = (index: number) => {
    const color = selectedGems[index];
    if (!color) return;
    const updated = [...selectedGems];
    updated[index] = null;
    setSelectedGems(updated);
    setLocalGems((prev) => ({ ...prev, [color]: prev[color] + 1 }));
  };

  const getEnabled = canGetGems(data, userID, selectedGems);

  return (
    <div className={styles.gemSelector}>
      <div className={styles.gemRow}>
        {/* 待选槽位 */}
        <div className={styles.slots}>
          {selectedGems.map((color, idx) => (
            <div className={styles.slot} key={idx} onClick={() => handleRemoveGem(idx)}>
              {color ? <GemToken color={color} size="md" className={styles.slotGem} /> : <span className={styles.slotPlaceholder} />}
            </div>
          ))}
        </div>

        {/* 宝石池 */}
        <div className={styles.pool}>
          {gemColors.map((color) => {
            const stock = localGems[color as CardColorType] ?? 0;
            const isGold = color === 'Gold';
            const clickable = isMyTurn && !isGold && stock > 0;
            return (
              <motion.div
                key={color}
                className={styles.poolItem}
                whileTap={clickable ? { scale: 0.85 } : {}}
                whileHover={clickable ? { scale: 1.1, filter: 'drop-shadow(0 0 8px gold)' } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
                onClick={() => {
                  if (!clickable) return;
                  handleClickGem(color as CardColorType);
                }}
                title={GemColor[color].label}
              >
                {stock > 0 ? (
                  <GemToken color={color} count={stock} size="lg" className={styles.poolGem} />
                ) : (
                  <span className={styles.emptyGem} />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 操作 */}
      <div className={styles.actions}>
        <Button
          customType="primary"
          disabled={!getEnabled}
          content="拿取"
          onClick={() => {
            const gemCount = selectedGems.filter(Boolean).reduce((acc, color) => {
              const c = color as CardColorType;
              acc[c] = (acc[c] || 0) + 1;
              return acc;
            }, {} as Record<CardColorType, number>);
            sendMessage(JSON.stringify({ type: 'game_get_gem', payload: gemCount }));
            setSelectedGems([null, null, null]);
          }}
        />
        <Button content="取消" onClick={() => setSelectedGems([null, null, null])} />
        <Button
          disabled={!isMyTurn}
          content="跳过"
          onClick={() => {
            sendMessage(JSON.stringify({ type: 'game_get_gem', payload: {} }));
            setSelectedGems([null, null, null]);
          }}
        />
      </div>
    </div>
  );
};

export default GemSelect;
