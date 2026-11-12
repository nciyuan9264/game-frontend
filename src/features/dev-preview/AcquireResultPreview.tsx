import type { ComponentProps } from 'react';
import { AppShell } from '@/features/acquire/components/AppShell';
import { Results } from '@/features/acquire/pages/Results';
import { companyKeys } from '@/features/acquire/model/types';

const selfID = 'preview-player';
const rivalID = 'preview-rival';

const players = {
  [selfID]: {
    userID: selfID,
    playerID: selfID,
    displayName: '预览玩家',
    avatar: '',
    seatIndex: 0,
    online: true,
    ai: false,
    ready: true,
  },
  [rivalID]: {
    userID: rivalID,
    playerID: rivalID,
    displayName: '远山对手',
    avatar: '',
    seatIndex: 1,
    online: true,
    ai: false,
    ready: true,
  },
};

const companyInfo = Object.fromEntries(companyKeys.map((company, index) => [
  company,
  {
    name: company,
    stockPrice: 200 + index * 100,
    stockTotal: 25,
    tiles: index + 2,
  },
]));

const stocks = Object.fromEntries(companyKeys.map((company, index) => [
  company,
  index < 3 ? 2 - index % 2 : 0,
]));

const data = {
  roomID: 'PREVIEW-ACQUIRE',
  matchID: 'preview-acquire-r1',
  playerId: selfID,
  ownerID: selfID,
  playerData: {
    money: 6_000,
    stocks,
    tiles: [],
  },
  roomData: {
    players,
    playerOrder: [selfID, rivalID],
    companyInfo,
  },
  result: {
    [selfID]: {
      money: 6_000,
      stocks: 8_400,
      total: 14_400,
    },
    [rivalID]: {
      money: 5_000,
      stocks: 6_100,
      total: 11_100,
    },
  },
} as unknown as ComponentProps<typeof Results>['data'];

export default function AcquireResultPreview() {
  return <AppShell inMatch hideRail hideHeader title="本局结算"
    profile={{ name: '预览玩家' }}>
    <Results
      data={data}
      enabled
      canRestart
      onClose={() => {}}
      onLeave={() => {}}
      onRestart={() => {}}
    />
  </AppShell>;
}
