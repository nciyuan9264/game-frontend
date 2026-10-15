import { GuideCard, JoinCard, LobbyHero, PlayerSummary, RoomBrowser, type LobbyViewProps } from './parts';
import styles from './index.module.less';

export function LobbyDesktop(props: LobbyViewProps) {
  return <><LobbyHero onCreate={props.onCreate} onCompany={props.onCompany} /><div className={styles.layout}>
    <RoomBrowser {...props} />
    <aside className={styles.aside}><PlayerSummary {...props} /><JoinCard {...props} /><GuideCard /></aside>
  </div></>;
}
