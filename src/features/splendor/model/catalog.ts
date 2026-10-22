import {
  cardColors,
  gemMeta,
  type CardColor,
  type DevelopmentCard,
  type Noble,
} from './types';

const records = `
1 B 0 1g1w1r1b
1 B 0 1g1w1r2b
1 B 0 2b1r2w
2 B 1 2b2g3w
1 B 0 2g1r
1 B 0 2w2g
1 B 0 3g
2 B 1 3g2B3w
1 B 0 3r1B1g
1 B 1 4b
2 B 2 4g2r1b
2 B 2 5g3r
3 B 3 5g3w3r3b
2 B 2 5w
2 B 3 6B
3 B 4 6r3B3g
3 B 4 7r
3 B 5 7r3B
1 b 0 1r1w1B1g
2 b 2 1r4B2w
1 b 0 1w2B
1 b 0 2g2B
1 b 0 2g2r1w
2 b 1 2g3r2b
1 b 0 2r1w1B1g
1 b 0 3B
3 b 4 3b3B6w
1 b 0 3g1r1b
2 b 1 3g3B2b
3 b 3 3r3w5B3g
1 b 1 4r
2 b 2 5b
2 b 2 5w3b
2 b 3 6b
3 b 4 7w
3 b 5 7w3b
1 g 0 1r1w1B1b
1 g 0 1r1w2B1b
2 g 2 2b1B4w
1 g 0 2b2r
2 g 1 2g3r3w
1 g 0 2r2B1b
1 g 0 2w1b
1 g 0 3b1g1w
2 g 1 3b2B2w
1 g 0 3r
3 g 3 3r5w3B3b
1 g 1 4B
2 g 2 5b3g
2 g 2 5g
3 g 4 6b3g3w
2 g 3 6g
3 g 4 7b
3 g 5 7b3g
1 r 0 1g1w1B1b
1 r 0 1g2B2w
1 r 0 1g2w1B1b
1 r 0 1r3B1w
1 r 0 2b1g
2 r 1 2r3B2w
2 r 1 2r3B3b
1 r 0 2w2r
3 r 3 3g3w3B5b
1 r 0 3w
2 r 2 3w5B
2 r 2 4b2g1w
1 r 1 4w
2 r 2 5B
3 r 4 6g3r3b
2 r 3 6r
3 r 4 7g
3 r 5 7g3r
1 w 0 1b1B3w
1 w 0 1r1b1B1g
1 w 0 1r1b1B2g
1 w 0 2b2B
1 w 0 2g1B2b
1 w 0 2r1B
2 w 1 2r2B3g
1 w 0 3b
2 w 1 3b3r2w
3 w 4 3r6B3w
3 w 5 3w7B
1 w 1 4g
2 w 2 4r2B1g
2 w 2 5r
2 w 2 5r3B
3 w 3 5r3b3B3g
2 w 3 6w
3 w 4 7B
`;

const colorCodes = ['w', 'b', 'g', 'r', 'B'] as const;
const colorByCode: Record<string, CardColor> = {
  w: 'White', b: 'Blue', g: 'Green', r: 'Red', B: 'Black',
};
const presets = [
  ['1-g-1r1w1B1b', '1-b-2g2B', '1-r-2w2r', '1-w-4g'],
  ['2-w-5r', '2-b-2g3r2b', '2-g-5g', '2-B-2b2g3w'],
  ['3-w-7B', '3-b-7w3b', '3-g-3r5w3B3b', '3-r-7g'],
];
const presetNames = [
  '翡翠矿场', '蓝湾矿脉', '霞光采石场', '白岩采石场',
  '远洋商船', '运河航线', '绿宝石工坊', '金色商廊',
  '皇家珠宝行', '蓝色远航', '翡翠珍藏', '红绒宫殿',
];
const suffixes = [
  ['矿脉', '石窟', '山谷', '矿井', '溪谷', '山麓', '岩场', '矿区'],
  ['商船', '航路', '工坊', '驿站', '集市', '商廊'],
  ['宝库', '宫殿', '珍藏', '珠宝行'],
];
const colorNames = ['银月', '碧海', '苍翠', '赤霞', '墨石'];
const artByLevel = [
  [3, 1, 0, 2, 0],
  [4, 5, 6, 7, 7],
  [7, 4, 6, 7, 5],
];
const nobleCodes = [
  '4g4r', '4w4g', '4w4b', '4b4B', '4r4B',
  '3w3g3r', '3w3b3g', '3w3b3B', '3b3r3B', '3g3r3B',
];
const nobleNames = ['伊莎贝拉', '洛伦佐', '埃莉诺', '菲利普', '玛格丽特', '朱利亚诺', '凯瑟琳', '查理', '安妮', '阿方索'];
const nobleTitles = ['曼图亚侯爵夫人', '佛罗伦萨的赞助者', '托斯卡纳公爵夫人', '勃艮第的收藏家', '珍宝艺术赞助人', '米兰的鉴赏家', '王室艺术赞助人', '远洋贸易赞助人', '北方商路的守护者', '费拉拉的收藏家'];

interface CardDisplayMeta {
  name: string;
  art: number;
}

export interface NobleDisplayMeta {
  name: string;
  title: string;
  art: number;
}

function decodeCost(code: string) {
  const cost: Partial<Record<CardColor, number>> = {};
  for (const match of code.matchAll(/(\d+)([wbgrB])/g)) {
    cost[colorByCode[match[2]]] = Number(match[1]);
  }
  return cost;
}

function costKey(cost: Partial<Record<CardColor, number>>) {
  return cardColors.map(color => cost[color] ?? 0).join(',');
}

function cardKey(card: Pick<DevelopmentCard, 'level' | 'bonus' | 'points' | 'cost'>) {
  return `${card.level}|${card.bonus}|${card.points}|${costKey(card.cost)}`;
}

function nobleKey(cost: Noble['cost']) {
  return costKey(cost);
}

const cardCatalog = new Map<string, CardDisplayMeta>();
const counters = new Map<string, number>();
records.trim().split('\n').forEach(line => {
  const [levelCode, bonusCode, pointsCode, encodedCost] = line.trim().split(/\s+/);
  const level = Number(levelCode);
  const bonus = colorByCode[bonusCode];
  const colorIndex = colorCodes.indexOf(bonusCode as typeof colorCodes[number]);
  const countKey = `${level}-${bonus}`;
  const index = counters.get(countKey) ?? 0;
  counters.set(countKey, index + 1);
  const sourceID = `${level}-${bonusCode}-${encodedCost}`;
  const presetIndex = presets.flat().indexOf(sourceID);
  const suffix = suffixes[level - 1][index % suffixes[level - 1].length];
  const name = presetIndex >= 0 ? presetNames[presetIndex] : `${colorNames[colorIndex]}${suffix}`;
  const card = {
    level,
    bonus,
    points: Number(pointsCode),
    cost: decodeCost(encodedCost),
  };
  cardCatalog.set(cardKey(card), { name, art: artByLevel[level - 1][colorIndex] });
});

const nobleCatalog = new Map<string, NobleDisplayMeta>();
nobleCodes.forEach((code, index) => {
  nobleCatalog.set(nobleKey(decodeCost(code)), {
    name: nobleNames[index],
    title: nobleTitles[index],
    art: 8 + index % 4,
  });
});

export function cardDisplay(card: DevelopmentCard): CardDisplayMeta {
  return cardCatalog.get(cardKey(card)) ?? {
    name: `${['I', 'II', 'III'][card.level - 1] ?? card.level} 阶${gemMeta[card.bonus].label}发展卡`,
    art: artByLevel[Math.max(0, Math.min(2, card.level - 1))][cardColors.indexOf(card.bonus)],
  };
}

export function nobleDisplay(noble: Noble): NobleDisplayMeta {
  return nobleCatalog.get(nobleKey(noble.cost)) ?? {
    name: '远道而来的贵族',
    title: '艺术与珠宝的赞助者',
    art: 8,
  };
}
