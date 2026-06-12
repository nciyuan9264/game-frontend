import styles from './index.module.less';
import classNames from 'classnames';
import { SplendorWsRoomSyncData } from '@/types/SplendorRoom';
import { backendName2FrontendName } from '@/util/user';
import { cardColors, gemColors, GemColor, getCardCountByColor } from '../../utils/game';
import GemToken from '../Card/GemToken';

interface PlayerDataProps {
  data: SplendorWsRoomSyncData;
  userID: string;
}

const PlayerData = ({ data, userID }: PlayerDataProps) => {
  const entries = Object.entries(data.playerData || {}).filter(([id]) => id !== userID);

  return (
    <div className={styles.playerList}>
      {entries.map(([id, player]) => {
        const cardCount = getCardCountByColor(player.normalCard);
        const isCurrent = data.roomData.currentPlayer === id;
        return (
          <div key={id} className={classNames(styles.playerCard, { [styles.current]: isCurrent })}>
            <div className={styles.header}>
              <span className={styles.name}>{backendName2FrontendName(id)}</span>
              <span className={styles.score}>{player.score}</span>
            </div>
            <div className={styles.cardRow}>
              {cardColors.map((color) => {
                const count = cardCount[color] ?? 0;
                const visual = GemColor[color];
                return (
                  <div
                    key={color}
                    className={styles.cardCount}
                    style={{
                      background: `linear-gradient(150deg, ${visual.dark}, ${visual.main})`,
                      color: visual.text,
                      opacity: count === 0 ? 0.35 : 1,
                    }}
                  >
                    {count}
                  </div>
                );
              })}
            </div>
            <div className={styles.gemRow}>
              {gemColors.map((color) => {
                const num = player.gem?.[color] ?? 0;
                if (!num) return null;
                return <GemToken key={color} color={color} count={num} size="sm" />;
              })}
            </div>
            <div className={styles.footer}>
              <span>预留 {player.reserveCard?.length ?? 0}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerData;
