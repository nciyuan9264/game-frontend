import { Home } from 'lucide-react';

export const ForSaleLoading = ({
  title = '正在准备下一场拍卖。',
  description = '同步房间、玩家与牌桌状态',
  fullScreen = false,
}: {
  title?: string;
  description?: string;
  fullScreen?: boolean;
}) => <div className={`fs-loading ${fullScreen ? 'full' : ''}`} role="status">
  <span><Home size={24} /></span><h2>{title}</h2><p>{description}</p>
  <i><b /><b /><b /></i>
</div>;
