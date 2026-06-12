import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import styles from './index.module.less';
import classNames from 'classnames';
import { SplendorNormalCard, SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { canBuy, canPreserve } from '../../utils/game';
import NormalCard from '../Card/NormalCard';
import NobleCard from '../Card/NobleCard';
import { Button } from '@/components/Button';

interface CardBoardProps {
  data: SplendorWsRoomSyncData;
  sendMessage: (msg: string) => void;
  selectedCard?: SplendorNormalCard;
  setSelectedCard: React.Dispatch<React.SetStateAction<SplendorNormalCard | undefined>>;
  isFinePointer: boolean;
}

type Level = 1 | 2 | 3;
type CardSlots = Record<Level, (SplendorNormalCard | null)[]>;

const LEVELS: Level[] = [3, 2, 1];
const SLOT_COUNT = 4;

const createInitialSlots = (cards: SplendorNormalCard[] = []) => {
  const slots = Array(SLOT_COUNT).fill(null) as (SplendorNormalCard | null)[];
  cards.slice(0, SLOT_COUNT).forEach((card, index) => {
    slots[index] = card;
  });
  return slots;
};

const syncCardSlots = (
  prevSlots: (SplendorNormalCard | null)[],
  incomingCards: SplendorNormalCard[] = []
) => {
  const incoming = incomingCards.slice(0, SLOT_COUNT);
  const incomingById = new Map(incoming.map((card) => [card.id, card]));
  const retainedIds = new Set<number>();
  const nextSlots = prevSlots.slice(0, SLOT_COUNT).map((card) => {
    if (card && incomingById.has(card.id)) {
      retainedIds.add(card.id);
      return incomingById.get(card.id)!;
    }
    return null;
  });

  incoming
    .filter((card) => !retainedIds.has(card.id))
    .forEach((card) => {
      const emptyIndex = nextSlots.findIndex((slot) => slot === null);
      if (emptyIndex >= 0) {
        nextSlots[emptyIndex] = card;
      }
    });

  while (nextSlots.length < SLOT_COUNT) {
    nextSlots.push(null);
  }

  return nextSlots;
};

const createSlotsFromData = (data: SplendorWsRoomSyncData): CardSlots => ({
  1: createInitialSlots(data.roomData.card?.[1] || []),
  2: createInitialSlots(data.roomData.card?.[2] || []),
  3: createInitialSlots(data.roomData.card?.[3] || []),
});

const CardBoard = ({ data, sendMessage, selectedCard, setSelectedCard }: CardBoardProps) => {
  const [slotsByLevel, setSlotsByLevel] = useState<CardSlots>(() => createSlotsFromData(data));
  const nobles = useMemo(
    () => [...(data.roomData.nobles || [])].sort((a, b) => a.id.localeCompare(b.id)),
    [data.roomData.nobles]
  );

  useEffect(() => {
    setSlotsByLevel((prev) => ({
      1: syncCardSlots(prev[1], data.roomData.card?.[1] || []),
      2: syncCardSlots(prev[2], data.roomData.card?.[2] || []),
      3: syncCardSlots(prev[3], data.roomData.card?.[3] || []),
    }));
  }, [data.roomData.card]);

  const buyable = canBuy(data, selectedCard);
  const preservable = canPreserve(data, selectedCard);

  return (
    <div className={styles.cardBoard}>
      {/* 主区：左侧贵族列 + 右侧发展卡阵 */}
      <div className={styles.mainArea}>
        {/* 贵族列（纵向） */}
        <div className={styles.nobleColumn}>
          {nobles.map((noble) => (
            <NobleCard key={noble.id} noble={noble} size="md" />
          ))}
        </div>

        {/* 三级发展卡阵 */}
        <div className={styles.cardRows}>
          {LEVELS.map((level) => {
            return (
              <div key={level} className={styles.cardRow}>
                <div className={styles.cards}>
                  {slotsByLevel[level].map((card, slotIndex) => (
                    <motion.div
                      layout
                      key={`${level}-${slotIndex}`}
                      className={classNames(styles.cardSlot, {
                        [styles.selected]: card && selectedCard?.id === card.id,
                        [styles.buyable]: card && canBuy(data, card),
                        [styles.emptySlot]: !card,
                      })}
                      onClick={() => {
                        if (card) setSelectedCard(card);
                      }}
                    >
                      {card && (
                        <motion.div
                          key={card.id}
                          className={styles.cardSlotInner}
                          initial={{ opacity: 0, y: -10, scale: 0.94, rotateZ: -2 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateZ: 0 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                        >
                          <NormalCard card={card} size="md" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <Button
          customType="primary"
          disabled={!buyable}
          content="购买"
          onClick={() => {
            if (!selectedCard) return;
            sendMessage(
              JSON.stringify({
                type: 'game_buy_card',
                payload: selectedCard.id,
              })
            );
          }}
        />
        <Button
          disabled={!preservable}
          content="预购"
          onClick={() => {
            if (!selectedCard) return;
            sendMessage(
              JSON.stringify({
                type: 'game_preserve_card',
                payload: selectedCard.id,
              })
            );
          }}
        />
      </div>
    </div>
  );
};

export default CardBoard;
