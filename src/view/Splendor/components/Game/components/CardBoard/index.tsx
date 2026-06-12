import { useMemo } from 'react';
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

const LEVELS = [3, 2, 1];

const CardBoard = ({ data, sendMessage, selectedCard, setSelectedCard }: CardBoardProps) => {
  const nobles = useMemo(
    () => [...(data.roomData.nobles || [])].sort((a, b) => a.id.localeCompare(b.id)),
    [data.roomData.nobles]
  );

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
            const cards = [...(data.roomData.card?.[level] || [])].sort((a, b) => a.id - b.id);
            return (
              <div key={level} className={styles.cardRow}>
                <div className={styles.cards}>
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={classNames(styles.cardSlot, {
                        [styles.selected]: selectedCard?.id === card.id,
                        [styles.buyable]: canBuy(data, card),
                      })}
                      onClick={() => setSelectedCard(card)}
                    >
                      <NormalCard card={card} size="md" />
                    </div>
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
