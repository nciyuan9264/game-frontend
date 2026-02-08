import styles from './index.module.less';


export enum Status {
  Waiting = 'not-ready',//待准备
  Ready = 'ready',//已准备
}
export default ({status}: {status: Status}) => {
  return (
    <div className={`${styles['status-tag']} ${status === Status.Waiting ? styles.waiting : styles.ready}`}>
      <span className={`${styles.dot} ${status === Status.Waiting ? styles.waiting : styles.ready}`}></span>
      {status === Status.Waiting ? '待准备' : '已准备'}
    </div>
  )
};