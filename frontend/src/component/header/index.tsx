import React, { CSSProperties } from "react";
import styles from "./index.module.less";
import { rootFontSize } from "@/const/env";
import { usePersonStore } from "@/store/config";
import { Left } from "@icon-park/react";

interface IProps {
  title?: string;
  onBack?: () => void;
  style?: CSSProperties;
  showBackIcon?: boolean;
}

const Header: React.FC<IProps> = (props: IProps) => {
  const {
    title,
    style,
    showBackIcon = true,
    onBack
  } = props;
  const { env } = usePersonStore();

  return (
    <div className={styles.container} style={{ marginTop: `${(env?.statusBarHeight ?? 0) / rootFontSize}rem`, ...style }}>
      {/* 顶部导航 */}
      <div className={styles.title}>{title}</div>
      {showBackIcon && <div className={styles.back} onClick={() => { onBack?.(); }}><Left theme="outline" size="24" fill="#333" /></div>}
    </div>
  );
};

export default Header;
