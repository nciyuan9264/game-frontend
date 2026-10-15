import { JoinCard, LobbyHero, RoomBrowser, type LobbyViewProps } from './parts';
import styles from './index.module.less';

export function LobbyMobile(props: LobbyViewProps) {
  return <><LobbyHero onCreate={props.onCreate} onCompany={props.onCompany} /><RoomBrowser {...props} />
    <div className={styles.mobileJoin}><JoinCard {...props} /></div>
  </>;
}
