import { QRCode } from 'antd';
import { QrCode } from 'lucide-react';

export interface GameShareContentClasses {
  root?: string;
  qr?: string;
  address?: string;
  hint?: string;
}

export function GameShareContent({
  url,
  classes,
  color,
  background,
  size = 184,
  description = '朋友可以扫码进入大厅，也可以使用复制的链接直接打开。',
}: {
  url: string;
  classes: GameShareContentClasses;
  color: string;
  background: string;
  size?: number;
  description?: string;
}) {
  return <div className={classes.root}>
    <div className={classes.qr}>
      <QRCode
        type="svg"
        value={url}
        size={size}
        bordered={false}
        color={color}
        bgColor={background}
        errorLevel="M"
      />
    </div>
    <div className={classes.address}>
      <span>游戏地址</span>
      <strong>{url}</strong>
    </div>
    <p className={classes.hint}>
      <QrCode size={16} />
      {description}
    </p>
  </div>;
}
