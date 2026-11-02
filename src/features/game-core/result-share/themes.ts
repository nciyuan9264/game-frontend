import type { GameType } from '@/hooks/useGameType';

export interface ResultCardTheme {
  title: string;
  englishTitle: string;
  scoreLabel: string;
  primary: string;
  secondary: string;
  paper: string;
  ink: string;
  accent: string;
  roleLabels?: Record<string, string>;
}

export const resultCardThemes = {
  acquire: {
    title: '并购风云',
    englishTitle: 'ACQUIRE',
    scoreLabel: '总资产',
    primary: '#123d44',
    secondary: '#b89445',
    paper: '#f3efe5',
    ink: '#17282b',
    accent: '#b4493d',
  },
  davinci: {
    title: '达芬奇密码',
    englishTitle: 'DA VINCI CODE',
    scoreLabel: '未公开牌',
    primary: '#15181d',
    secondary: '#d7d1c7',
    paper: '#f4f1eb',
    ink: '#17191d',
    accent: '#b83c42',
  },
  splendor: {
    title: '璀璨宝石',
    englishTitle: 'SPLENDOR',
    scoreLabel: '声望',
    primary: '#183f52',
    secondary: '#c6a35b',
    paper: '#f4efe3',
    ink: '#172b36',
    accent: '#9d3f52',
  },
  yinsh: {
    title: '圈套棋',
    englishTitle: 'YINSH',
    scoreLabel: '取环',
    primary: '#22272b',
    secondary: '#d7b664',
    paper: '#f2f0e9',
    ink: '#1b2023',
    accent: '#b54a3e',
  },
  othello: {
    title: '黑白棋',
    englishTitle: 'OTHELLO',
    scoreLabel: '终局棋子',
    primary: '#173e32',
    secondary: '#d8d2c5',
    paper: '#f2f0e9',
    ink: '#18251f',
    accent: '#b8903d',
  },
  hex: {
    title: '连边棋',
    englishTitle: 'HEX',
    scoreLabel: '落子',
    primary: '#0f5555',
    secondary: '#d05a4e',
    paper: '#f3efe7',
    ink: '#173032',
    accent: '#d5a63b',
    roleLabels: { red: '赤色', teal: '青色' },
  },
  quoridor: {
    title: '步步为营',
    englishTitle: 'QUORIDOR',
    scoreLabel: '剩余围墙',
    primary: '#274252',
    secondary: '#d1a64d',
    paper: '#f2eee5',
    ink: '#1d2b33',
    accent: '#ae4b3e',
    roleLabels: { south: '南方', north: '北方' },
  },
  onitama: {
    title: '御神乐棋',
    englishTitle: 'ONITAMA',
    scoreLabel: '存活棋子',
    primary: '#26334e',
    secondary: '#be4b43',
    paper: '#f3eee5',
    ink: '#20283a',
    accent: '#c49a43',
    roleLabels: { blue: '蓝方', red: '红方' },
  },
  hive: {
    title: '虫棋',
    englishTitle: 'HIVE',
    scoreLabel: '蜂后压力',
    primary: '#37372e',
    secondary: '#d6b33f',
    paper: '#f1efe5',
    ink: '#29291f',
    accent: '#6f7650',
    roleLabels: { white: '白方', black: '黑方' },
  },
  warchest: {
    title: '战争之匣',
    englishTitle: 'WAR CHEST',
    scoreLabel: '据点',
    primary: '#3b3b37',
    secondary: '#a98a53',
    paper: '#f1ede4',
    ink: '#292925',
    accent: '#8f3f3b',
    roleLabels: { oak: '橡木军团', falcon: '猎鹰军团' },
  },
  forsale: {
    title: '地产拍卖',
    englishTitle: 'FOR SALE',
    scoreLabel: '总资产',
    primary: '#24495a',
    secondary: '#cf9d45',
    paper: '#f3eee3',
    ink: '#1d3038',
    accent: '#a84a3e',
  },
  loveletter: {
    title: '掌心密信',
    englishTitle: 'PALM LETTER',
    scoreLabel: '好感',
    primary: '#743b52',
    secondary: '#c99e56',
    paper: '#f6eee9',
    ink: '#422733',
    accent: '#557052',
  },
  sixnimmt: {
    title: '6 nimmt!',
    englishTitle: '6 NIMMT!',
    scoreLabel: '牛头',
    primary: '#304a3c',
    secondary: '#cfb542',
    paper: '#f3f0df',
    ink: '#26332b',
    accent: '#bd5144',
  },
  cantstop: {
    title: "Can't Stop",
    englishTitle: "CAN'T STOP",
    scoreLabel: '封锁路线',
    primary: '#265a63',
    secondary: '#e2b54f',
    paper: '#f1eee2',
    ink: '#20373a',
    accent: '#c04c42',
  },
  fugitive: {
    title: '逃亡者',
    englishTitle: 'FUGITIVE',
    scoreLabel: '路线进度',
    primary: '#313a43',
    secondary: '#c49b56',
    paper: '#f0ece3',
    ink: '#242b31',
    accent: '#9d403a',
    roleLabels: { fugitive: '逃亡者', marshal: '追捕者' },
  },
} satisfies Record<GameType, ResultCardTheme>;

export function resultCardTheme(gameType: GameType): ResultCardTheme {
  return resultCardThemes[gameType];
}
