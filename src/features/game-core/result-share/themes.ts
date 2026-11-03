import acquireArtwork from '@/features/acquire/assets/city-art.webp';
import cantStopArtwork from '@/features/cantstop/assets/camp.webp';
import davinciArtwork from '@/features/davinci/assets/hero.jpg';
import forSaleArtwork from '@/features/forsale/assets/neighborhood.webp';
import fugitiveArtwork from '@/features/fugitive/assets/hero.webp';
import loveLetterArtwork from '@/features/loveletter/assets/still-life.webp';
import sixNimmtArtwork from '@/features/sixnimmt/assets/mascot.webp';
import splendorArtwork from '@/features/splendor/assets/hero.webp';
import warChestArtwork from '@/features/warchest/assets/campaign.webp';
import type { GameType } from '@/hooks/useGameType';

export type ResultCardFamily =
  | 'commerce'
  | 'abstract'
  | 'deduction'
  | 'festival';

export type ResultCardMetricStyle =
  | 'wealth'
  | 'prestige'
  | 'score'
  | 'role'
  | 'progress';

export interface ResultCardArtwork {
  src: string;
  position: string;
  treatment: 'light' | 'dark' | 'vivid';
}

export interface ResultCardTheme {
  title: string;
  englishTitle: string;
  scoreLabel: string;
  family: ResultCardFamily;
  emblem: GameType;
  motif: string;
  metricStyle: ResultCardMetricStyle;
  primary: string;
  secondary: string;
  paper: string;
  ink: string;
  accent: string;
  surface: string;
  muted: string;
  winner: string;
  self: string;
  artwork?: ResultCardArtwork;
  headlineCopy: {
    win: readonly [string, string];
    draw: readonly [string, string];
    loss: readonly [string, string];
  };
  roleLabels?: Record<string, string>;
}

const commerceCopy = {
  win: ['本局入账', '漂亮收官，值得留作纪念'],
  draw: ['并列封盘', '这一局的高光由你们共享'],
  loss: ['落袋为安', '胜负落定，下一局继续'],
} as const;

const abstractCopy = {
  win: ['拿下胜局', '每一步都算数'],
  draw: ['势均力敌', '棋盘记住了这场交锋'],
  loss: ['棋局已定', '复盘之后，再下一城'],
} as const;

const deductionCopy = {
  win: ['谜底揭晓', '线索最终指向胜利'],
  draw: ['平分线索', '真相停在最后一线'],
  loss: ['行动收束', '真相落定，故事未完'],
} as const;

const festivalCopy = {
  win: ['今日主角', '欢呼留在这一刻'],
  draw: ['共享高光', '这一局，快乐不分先后'],
  loss: ['精彩落幕', '好戏散场，下一局见'],
} as const;

export const resultCardThemes = {
  acquire: {
    title: '并购风云',
    englishTitle: 'ACQUIRE',
    scoreLabel: '总资产',
    family: 'commerce',
    emblem: 'acquire',
    motif: 'city-ledger',
    metricStyle: 'wealth',
    primary: '#123d44',
    secondary: '#b89445',
    paper: '#f4f0e6',
    ink: '#17282b',
    accent: '#b4493d',
    surface: '#e6e2d7',
    muted: '#667275',
    winner: '#b89445',
    self: '#1b6269',
    artwork: {
      src: acquireArtwork,
      position: '63% 50%',
      treatment: 'light',
    },
    headlineCopy: commerceCopy,
  },
  davinci: {
    title: '达芬奇密码',
    englishTitle: 'DA VINCI CODE',
    scoreLabel: '未公开牌',
    family: 'deduction',
    emblem: 'davinci',
    motif: 'cipher-grid',
    metricStyle: 'score',
    primary: '#15181d',
    secondary: '#d7d1c7',
    paper: '#f4f1eb',
    ink: '#17191d',
    accent: '#b83c42',
    surface: '#e5e0d8',
    muted: '#666970',
    winner: '#b83c42',
    self: '#586a7c',
    artwork: {
      src: davinciArtwork,
      position: '58% 44%',
      treatment: 'dark',
    },
    headlineCopy: deductionCopy,
  },
  splendor: {
    title: '璀璨宝石',
    englishTitle: 'SPLENDOR',
    scoreLabel: '声望',
    family: 'commerce',
    emblem: 'splendor',
    motif: 'gem-facet',
    metricStyle: 'prestige',
    primary: '#183f52',
    secondary: '#c6a35b',
    paper: '#f4efe3',
    ink: '#172b36',
    accent: '#9d3f52',
    surface: '#e7e0d2',
    muted: '#67747a',
    winner: '#b88d3f',
    self: '#2d6678',
    artwork: {
      src: splendorArtwork,
      position: '66% 43%',
      treatment: 'vivid',
    },
    headlineCopy: commerceCopy,
  },
  yinsh: {
    title: '圈套棋',
    englishTitle: 'YINSH',
    scoreLabel: '取环',
    family: 'abstract',
    emblem: 'yinsh',
    motif: 'ring-axis',
    metricStyle: 'score',
    primary: '#22272b',
    secondary: '#d7b664',
    paper: '#f2f0e9',
    ink: '#1b2023',
    accent: '#b54a3e',
    surface: '#e2dfd6',
    muted: '#6b6e70',
    winner: '#b6903e',
    self: '#5c6870',
    headlineCopy: abstractCopy,
  },
  othello: {
    title: '黑白棋',
    englishTitle: 'OTHELLO',
    scoreLabel: '终局棋子',
    family: 'abstract',
    emblem: 'othello',
    motif: 'disc-balance',
    metricStyle: 'score',
    primary: '#173e32',
    secondary: '#d8d2c5',
    paper: '#f2f0e9',
    ink: '#18251f',
    accent: '#b8903d',
    surface: '#dedfd8',
    muted: '#68736d',
    winner: '#b8903d',
    self: '#2f6755',
    headlineCopy: abstractCopy,
  },
  hex: {
    title: '连边棋',
    englishTitle: 'HEX',
    scoreLabel: '落子',
    family: 'abstract',
    emblem: 'hex',
    motif: 'hex-connection',
    metricStyle: 'role',
    primary: '#0f5555',
    secondary: '#d05a4e',
    paper: '#f3efe7',
    ink: '#173032',
    accent: '#d5a63b',
    surface: '#dfe2da',
    muted: '#637577',
    winner: '#c6922e',
    self: '#1d7372',
    headlineCopy: abstractCopy,
    roleLabels: { red: '赤色', teal: '青色' },
  },
  quoridor: {
    title: '步步为营',
    englishTitle: 'QUORIDOR',
    scoreLabel: '剩余围墙',
    family: 'abstract',
    emblem: 'quoridor',
    motif: 'maze-lines',
    metricStyle: 'role',
    primary: '#274252',
    secondary: '#d1a64d',
    paper: '#f2eee5',
    ink: '#1d2b33',
    accent: '#ae4b3e',
    surface: '#e0ddd5',
    muted: '#68737a',
    winner: '#bd913c',
    self: '#3a6579',
    headlineCopy: abstractCopy,
    roleLabels: { south: '南方', north: '北方' },
  },
  onitama: {
    title: '御神乐棋',
    englishTitle: 'ONITAMA',
    scoreLabel: '存活棋子',
    family: 'abstract',
    emblem: 'onitama',
    motif: 'temple-axis',
    metricStyle: 'role',
    primary: '#26334e',
    secondary: '#be4b43',
    paper: '#f3eee5',
    ink: '#20283a',
    accent: '#c49a43',
    surface: '#e2ddd4',
    muted: '#6a6d78',
    winner: '#b7403a',
    self: '#41577c',
    headlineCopy: abstractCopy,
    roleLabels: { blue: '蓝方', red: '红方' },
  },
  hive: {
    title: '虫棋',
    englishTitle: 'HIVE',
    scoreLabel: '蜂后压力',
    family: 'abstract',
    emblem: 'hive',
    motif: 'honeycomb',
    metricStyle: 'role',
    primary: '#37372e',
    secondary: '#d6b33f',
    paper: '#f1efe5',
    ink: '#29291f',
    accent: '#6f7650',
    surface: '#dfddd2',
    muted: '#707066',
    winner: '#b99324',
    self: '#62694a',
    headlineCopy: abstractCopy,
    roleLabels: { white: '白方', black: '黑方' },
  },
  warchest: {
    title: '战争之匣',
    englishTitle: 'WAR CHEST',
    scoreLabel: '据点',
    family: 'abstract',
    emblem: 'warchest',
    motif: 'campaign-crest',
    metricStyle: 'role',
    primary: '#3b3b37',
    secondary: '#a98a53',
    paper: '#f1ede4',
    ink: '#292925',
    accent: '#8f3f3b',
    surface: '#ded9ce',
    muted: '#716f68',
    winner: '#98763f',
    self: '#665e51',
    artwork: {
      src: warChestArtwork,
      position: '58% 48%',
      treatment: 'dark',
    },
    headlineCopy: abstractCopy,
    roleLabels: { oak: '橡木军团', falcon: '猎鹰军团' },
  },
  forsale: {
    title: '地产拍卖',
    englishTitle: 'FOR SALE',
    scoreLabel: '总资产',
    family: 'commerce',
    emblem: 'forsale',
    motif: 'auction-stamp',
    metricStyle: 'wealth',
    primary: '#24495a',
    secondary: '#cf9d45',
    paper: '#f3eee3',
    ink: '#1d3038',
    accent: '#a84a3e',
    surface: '#e4ded3',
    muted: '#68757a',
    winner: '#b88935',
    self: '#39677a',
    artwork: {
      src: forSaleArtwork,
      position: '57% 48%',
      treatment: 'light',
    },
    headlineCopy: commerceCopy,
  },
  loveletter: {
    title: '掌心密信',
    englishTitle: 'PALM LETTER',
    scoreLabel: '好感',
    family: 'festival',
    emblem: 'loveletter',
    motif: 'wax-seal',
    metricStyle: 'prestige',
    primary: '#743b52',
    secondary: '#c99e56',
    paper: '#f6eee9',
    ink: '#422733',
    accent: '#557052',
    surface: '#eadedb',
    muted: '#816c74',
    winner: '#bd8c3e',
    self: '#875069',
    artwork: {
      src: loveLetterArtwork,
      position: '50% 50%',
      treatment: 'vivid',
    },
    headlineCopy: festivalCopy,
  },
  sixnimmt: {
    title: '6 nimmt!',
    englishTitle: '6 NIMMT!',
    scoreLabel: '牛头',
    family: 'festival',
    emblem: 'sixnimmt',
    motif: 'bull-ticket',
    metricStyle: 'score',
    primary: '#304a3c',
    secondary: '#cfb542',
    paper: '#f3f0df',
    ink: '#26332b',
    accent: '#bd5144',
    surface: '#e3e1d0',
    muted: '#6c796f',
    winner: '#b69d2f',
    self: '#466c55',
    artwork: {
      src: sixNimmtArtwork,
      position: '50% 50%',
      treatment: 'vivid',
    },
    headlineCopy: festivalCopy,
  },
  cantstop: {
    title: "Can't Stop",
    englishTitle: "CAN'T STOP",
    scoreLabel: '封锁路线',
    family: 'festival',
    emblem: 'cantstop',
    motif: 'mountain-route',
    metricStyle: 'progress',
    primary: '#265a63',
    secondary: '#e2b54f',
    paper: '#f1eee2',
    ink: '#20373a',
    accent: '#c04c42',
    surface: '#dfded3',
    muted: '#68787a',
    winner: '#c89b34',
    self: '#39747c',
    artwork: {
      src: cantStopArtwork,
      position: '48% 48%',
      treatment: 'vivid',
    },
    headlineCopy: festivalCopy,
  },
  fugitive: {
    title: '逃亡者',
    englishTitle: 'FUGITIVE',
    scoreLabel: '路线进度',
    family: 'deduction',
    emblem: 'fugitive',
    motif: 'case-route',
    metricStyle: 'role',
    primary: '#313a43',
    secondary: '#c49b56',
    paper: '#f0ece3',
    ink: '#242b31',
    accent: '#9d403a',
    surface: '#dfdad1',
    muted: '#70757a',
    winner: '#aa8141',
    self: '#536979',
    artwork: {
      src: fugitiveArtwork,
      position: '62% 48%',
      treatment: 'dark',
    },
    headlineCopy: deductionCopy,
    roleLabels: { fugitive: '逃亡者', marshal: '追捕者' },
  },
} satisfies Record<GameType, ResultCardTheme>;

export function resultCardTheme(gameType: GameType): ResultCardTheme {
  return resultCardThemes[gameType];
}

export function isResultCardGameType(value: string): value is GameType {
  return Object.prototype.hasOwnProperty.call(resultCardThemes, value);
}

const artworkTasks = new Map<string, Promise<void>>();

export function preloadResultCardArtwork(gameType: GameType): Promise<void> {
  const artwork = resultCardTheme(gameType).artwork;
  if (!artwork || typeof Image === 'undefined') return Promise.resolve();
  const existing = artworkTasks.get(artwork.src);
  if (existing) return existing;
  const task = new Promise<void>(resolve => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = artwork.src;
    if (image.complete) resolve();
  });
  artworkTasks.set(artwork.src, task);
  return task;
}
