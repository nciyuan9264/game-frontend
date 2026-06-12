import styles from './index.module.less';
import classNames from 'classnames';
import { Empty } from 'antd';
import { SplendorNormalCard, SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { canBuy, cardColors, GemColor, getCardCountByColor } from '../../utils/game';
import NormalCard from '../Card/NormalCard';
import GemToken from '../Card/GemToken';

interface UserDataProps {
  data: SplendorWsRoomSyncData;
  userID: string;
  selectedCard?: SplendorNormalCard;
  setSelectedCard: React.Dispatch<React.SetStateAction<SplendorNormalCard | undefined>>;
}

const UserData = ({ data, userID, selectedCard, setSelectedCard }: UserDataProps) => {
  const player = data.playerData[userID];
  const { gem, reserveCard } = player ?? {};
  const cardCount = getCardCountByColor(player?.normalCard);

  return (
    <div className={styles.userData}>
      <div className={styles.topRow}>
        <div className={styles.cardGemSection}>
          {cardColors.map((color) => {
            const count = cardCount[color] ?? 0;
            const gemNum = gem?.[color] ?? 0;
            const visual = GemColor[color];
            return (
              <div key={color} className={styles.colorColumn}>
                <div
                  className={styles.cardCount}
                  style={{
                    background: `linear-gradient(150deg, ${visual.dark}, ${visual.main})`,
                    color: visual.text,
                    opacity: count === 0 ? 0.35 : 1,
                  }}
                >
                  {count}
                </div>
                <GemToken
                  color={color}
                  count={gemNum}
                  size="sm"
                  className={classNames(styles.gemToken, { [styles.dim]: gemNum === 0 })}
                />
              </div>
            );
          })}
          <div className={styles.colorColumn}>
            <div className={styles.cardCountPlaceholder} />
            <GemToken color="Gold" count={gem?.['Gold'] ?? 0} size="sm" className={styles.gemToken} />
          </div>
        </div>

        <div className={styles.reserveSection}>
        {Array(3)
          .fill(0)
          .map((_, index) => {
            const card = reserveCard?.[index];
            return card ? (
              <div
                key={index}
                className={classNames(styles.reserveSlot, {
                  [styles.selected]: selectedCard?.id === card.id,
                  [styles.buyable]: canBuy(data, card),
                })}
                onClick={() => setSelectedCard(card)}
              >
                <NormalCard card={card} size="sm" />
              </div>
            ) : (
              <div key={index} className={styles.reserveEmpty}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserData;
