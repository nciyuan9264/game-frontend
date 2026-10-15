import { RoomFacts, StartBar, TablePanel, type RoomProps } from './parts';
import styles from './index.module.less';

export function RoomDesktop(props: RoomProps) {
  return <><div className={styles.desktop}>
    <TablePanel {...props} /><RoomFacts {...props} />
  </div><StartBar {...props} /></>;
}
