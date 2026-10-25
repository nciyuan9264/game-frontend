import {
  RoomFacts,
  StartBar,
  TablePanel,
  type RoomProps,
} from './parts';
import styles from './index.module.less';

export function RoomMobile(props: RoomProps) {
  return <><div className={styles.mobile}>
    <TablePanel {...props} />
    <RoomFacts {...props} />
  </div><StartBar {...props} /></>;
}
