import { useMemo, useState } from 'react';
import styles from './index.module.less';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Brain,
  BrickWall,
  Coins,
  CircleDot,
  Cpu,
  Crown,
  EyeOff,
  Footprints,
  Gem,
  Hash,
  Monitor,
  Move,
  Puzzle,
  Search,
  Smartphone,
  Sparkles,
  Swords,
  Flag,
  Trophy,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const gameConfigs = [
  {
    key: 'acquire',
    tabTitle: '并购风云',
    tabSubtitle: 'ACQUIRE',
    tabStatus: '商业策略',
    badge: '经典桌游 · 线上完美还原',
    title: 'ACQUIRE',
    subtitle: '并购风云',
    description: '在指尖开启一场价值千万的商业博弈。选址、注资、合并、清算，谁才是最后的商业巨头？',
    route: '/game/acquire',
    cta: '进入并购大厅',
    footer: 'Portfolio War Room',
    features: [
      { icon: <Smartphone size={20} />, title: '全平台适配', desc: '手机/平板/PC 随时开局' },
      { icon: <Cpu size={20} />, title: '智能 AI 陪练', desc: '新手友好，老手过招' },
      { icon: <Users size={20} />, title: '多人联机', desc: '好友约战，实时竞技' },
      { icon: <Monitor size={20} />, title: '无需下载', desc: '网页即开即玩，极速体验' },
    ],
  },
  {
    key: 'davinci',
    tabTitle: '达芬奇密码',
    tabSubtitle: 'DA VINCI CODE',
    tabStatus: '隐藏推理',
    badge: '数字暗牌 · 心理推理对决',
    title: 'DA VINCI',
    subtitle: '达芬奇密码',
    description: '黑白数字暗藏线索，翻开一张牌就是一次心理较量。观察、试探、排除，在最短时间破解对手的密码序列。',
    route: '/game/davinci',
    cta: '进入达芬奇大厅',
    footer: 'Cipher Deduction Table',
    features: [
      { icon: <EyeOff size={20} />, title: '隐藏信息', desc: '暗牌排列，线索逐步浮现' },
      { icon: <Brain size={20} />, title: '逻辑推理', desc: '排除猜测，锁定真实数字' },
      { icon: <Puzzle size={20} />, title: '心理博弈', desc: '诱导对手，保护自身密码' },
      { icon: <Hash size={20} />, title: '快速开局', desc: '轻量规则，几分钟进入状态' },
    ],
  },
  {
    key: 'splendor',
    tabTitle: '璀璨宝石',
    tabSubtitle: 'SPLENDOR',
    tabStatus: '资源引擎',
    badge: '宝石商人 · 文艺复兴争锋',
    title: 'SPLENDOR',
    subtitle: '璀璨宝石',
    description: '收集五色宝石，购入发展卡，赢得贵族青睐。步步积累引擎，率先夺取 15 分声望，加冕最闪耀的珠宝巨匠。',
    route: '/game/splendor',
    cta: '进入宝石大厅',
    footer: 'Gem Merchant Guild',
    features: [
      { icon: <Gem size={20} />, title: '五色宝石', desc: '钻石/蓝宝/祖母绿/红宝/玛瑙' },
      { icon: <Coins size={20} />, title: '引擎构筑', desc: '发展卡叠加，越滚越强' },
      { icon: <Crown size={20} />, title: '贵族加冕', desc: '满足条件，坐拥额外声望' },
      { icon: <Sparkles size={20} />, title: '15 分制胜', desc: '率先达成者赢得对局' },
    ],
  },
  {
    key: 'yinsh',
    tabTitle: '圈套棋',
    tabSubtitle: 'YINSH',
    tabStatus: '抽象策略',
    badge: '黑白翻转 · 经典三环对决',
    title: 'YINSH',
    subtitle: '圈套棋',
    description: '移动圆环，留下棋子，翻转黑白。连成五子便取走一环，在越来越少的选择里，率先拿下第三环。',
    route: '/game/yinsh',
    cta: '进入 YINSH 大厅',
    footer: 'The Quiet Strategy',
    features: [
      { icon: <CircleDot size={20} />, title: '圆环移动', desc: '六向直线，落点由局势决定' },
      { icon: <Move size={20} />, title: '黑白翻转', desc: '每次跨越都改变棋盘归属' },
      { icon: <Brain size={20} />, title: '搜索型 AI', desc: '威胁判断与战术防守' },
      { icon: <Trophy size={20} />, title: '三环制胜', desc: '越接近胜利，行动工具越少' },
    ],
  },
  {
    key: 'othello',
    tabTitle: '黑白棋',
    tabSubtitle: 'OTHELLO',
    tabStatus: '翻转策略',
    badge: '六十四格 · 经典黑白对弈',
    title: 'OTHELLO',
    subtitle: '黑白棋',
    description: '落下一子，夹住并翻转对方棋子。争夺角落、控制行动力，在黑白反复转换之间，让终局盘面站在你这一边。',
    route: '/game/othello',
    cta: '进入黑白棋大厅',
    footer: 'The Art of Reversal',
    features: [
      { icon: <CircleDot size={20} />, title: '八向翻转', desc: '横竖斜线，一步改变多处归属' },
      { icon: <Move size={20} />, title: '行动力争夺', desc: '压缩落点，掌握回合主动' },
      { icon: <Brain size={20} />, title: '启发式 AI', desc: '角落、边线与终局综合判断' },
      { icon: <Trophy size={20} />, title: '实际子数', desc: '双方无子可下时，多者获胜' },
    ],
  },
  {
    key: 'quoridor',
    tabTitle: '步步为营',
    tabSubtitle: 'QUORIDOR',
    tabStatus: '路径策略',
    badge: '九乘九格 · 经典双人对决',
    title: 'QUORIDOR',
    subtitle: '步步为营',
    description: '移动棋子，落下围墙，在改写对手路线的同时守住自己的通路。越过相逢，绕开阻挡，率先抵达棋盘彼岸。',
    route: '/game/quoridor',
    cta: '进入步步为营大厅',
    footer: 'The Art of Finding a Way',
    features: [
      { icon: <Footprints size={20} />, title: '移动与跳跃', desc: '直行、越过与受阻后的斜绕' },
      { icon: <BrickWall size={20} />, title: '十道围墙', desc: '设障但不能封死任何通路' },
      { icon: <Cpu size={20} />, title: '权威 AI', desc: '真人与人机使用同一套规则' },
      { icon: <Flag size={20} />, title: '先到对边', desc: '抵达目标行即刻赢得对局' },
    ],
  },
  {
    key: 'warchest',
    tabTitle: '战争之匣',
    tabSubtitle: 'WAR CHEST',
    tabStatus: '战术调遣',
    badge: '完整基础版 · 十六兵种在线对决',
    title: 'WAR CHEST',
    subtitle: '战争之匣',
    description: '从军袋抽取指令，部署、增援、调遣并控制战场。让十六兵种各展所长，率先升起第六面旗帜。',
    route: '/game/warchest',
    cta: '进入战争之匣大厅',
    footer: 'The Art of Command',
    features: [
      { icon: <Swords size={20} />, title: '十六兵种', desc: '完整基础版，战术各有章法' },
      { icon: <Flag size={20} />, title: '六旗制胜', desc: '控制据点，而非歼灭敌军' },
      { icon: <Cpu size={20} />, title: '公平 AI', desc: '只读取自身可见隐藏信息' },
      { icon: <Brain size={20} />, title: '三种编成', desc: '推荐、随机与官方轮抽' },
    ],
  },
  {
    key: 'fugitive',
    tabTitle: '逃亡者',
    tabSubtitle: 'FUGITIVE',
    tabStatus: '非对称推理',
    badge: '午夜追逃 · 二版基础规则',
    title: 'FUGITIVE',
    subtitle: '逃亡者',
    description: '一人暗置路线奔向 42，一人借手中线索逐步搜查。规划冲刺、制造疑点，在不对称信息中决定这场午夜追逐。',
    route: '/game/fugitive',
    cta: '进入追逃大厅',
    footer: 'The Midnight Run',
    features: [
      { icon: <Footprints size={20} />, title: '暗置路线', desc: '藏身点与冲刺牌按身份隔离' },
      { icon: <Search size={20} />, title: '线索搜查', desc: '排除手牌，锁定未知号码' },
      { icon: <Brain size={20} />, title: '公平 AI', desc: '只依据当前角色可见信息决策' },
      { icon: <EyeOff size={20} />, title: '最终追缉', desc: '一次失误，逃亡者立即脱身' },
    ],
  },
] as const;

type GameKey = typeof gameConfigs[number]['key'];

const AcquireVisual = () => (
  <>
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.92, opacity: 0, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={styles.mockup}
    >
      <div className={styles.gameUI}>
        <div className={styles.header}>
          <div className={styles.avatar} />
          <div className={styles.turnBadge}>你的回合</div>
          <div className={styles.menuIcon} />
        </div>

        <div className={styles.stockList}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.stockItem}>
              <div className={styles.stockInfo}>
                <div className={styles.dot} style={{ backgroundColor: i === 1 ? '#60a5fa' : i === 2 ? '#34d399' : '#fbbf24' }} />
                <div className={styles.bar} />
              </div>
              <div className={styles.priceBar} />
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className={`${styles.cell} ${[12, 13, 19, 20, 21].includes(i) ? styles.active : ''}`} />
          ))}
        </div>

        <div className={styles.footerTiles}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.tile} />
          ))}
        </div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingCard} ${styles.blue}`}
    >
      <div className={styles.cardIcon} />
      <div className={styles.cardLine} />
      <div className={`${styles.cardLine} ${styles.short}`} />
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      className={`${styles.floatingCard} ${styles.emerald}`}
    >
      <div className={styles.cardIcon} />
      <div className={styles.cardLine} />
      <div className={`${styles.cardLine} ${styles.short}`} />
    </motion.div>
  </>
);

const DaVinciVisual = () => (
  <>
    <motion.div
      initial={{ scale: 0.82, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.92, opacity: 0, rotate: 4 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.cipherMockup}`}
    >
      <div className={styles.cipherUI}>
        <div className={styles.cipherHeader}>
          <div className={styles.signalDots}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.cipherBadge}>推理中</div>
        </div>

        <div className={styles.deductionLine}>
          <span>目标序列</span>
          <strong>?</strong>
          <strong>3</strong>
          <strong>?</strong>
          <strong>8</strong>
        </div>

        <div className={styles.codeBoard}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div
              key={i}
              className={`${styles.numberTile} ${[1, 4, 6].includes(i) ? styles.revealed : styles.hidden}`}
            >
              {[1, 3, 5, 8, 0, 7, 2, 9][i]}
            </div>
          ))}
        </div>

        <div className={styles.clueStack}>
          <div className={styles.clueRow}><span>排除</span><b>0 / 2 / 9</b></div>
          <div className={styles.clueRow}><span>锁定</span><b>黑牌 5</b></div>
          <div className={styles.scanLine} />
        </div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, -12, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.mysteryCard} ${styles.gold}`}
    >
      <span>?</span>
    </motion.div>

    <motion.div
      animate={{ y: [0, 12, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      className={`${styles.mysteryCard} ${styles.violet}`}
    >
      <span>7</span>
    </motion.div>
  </>
);

const gemPalette = [
  { light: '#ffffff', main: '#d7dde6', dark: '#9aa3b2' },
  { light: '#7cc2ff', main: '#3b82f6', dark: '#1d4ed8' },
  { light: '#5be0a6', main: '#10b981', dark: '#047857' },
  { light: '#ff9b9b', main: '#ef4444', dark: '#b91c1c' },
  { light: '#6b7280', main: '#374151', dark: '#111827' },
];

const SplendorVisual = () => (
  <>
    <motion.div
      initial={{ scale: 0.82, opacity: 0, rotate: 4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.92, opacity: 0, rotate: -4 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.splendorMockup}`}
    >
      <div className={styles.splendorUI}>
        <div className={styles.splendorHeader}>
          <div className={styles.signalDots}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.scoreBadge}>
            <Sparkles size={11} />
            15
          </div>
        </div>

        <div className={styles.gemRow}>
          {gemPalette.map((gem, i) => (
            <div
              key={i}
              className={styles.gemToken}
              style={{
                background: `radial-gradient(circle at 32% 28%, ${gem.light}, ${gem.main} 52%, ${gem.dark})`,
              }}
            />
          ))}
        </div>

        <div className={styles.cardGrid}>
          {[0, 1, 2, 3, 4, 5].map(i => {
            const gem = gemPalette[i % gemPalette.length];
            return (
              <div
                key={i}
                className={`${styles.devCard} ${[0, 4].includes(i) ? styles.active : ''}`}
                style={{
                  background: `linear-gradient(150deg, ${gem.dark} 0%, ${gem.main} 130%)`,
                }}
              >
                <span className={styles.devPoint}>{(i % 3) + 1}</span>
                <div className={styles.devCost}>
                  <i />
                  <i />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.nobleRow}>
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.nobleTile}>♛</div>
          ))}
        </div>
      </div>
    </motion.div>

    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      className={styles.floatingGem}
    >
      3
    </motion.div>

    <motion.div
      animate={{ y: [0, 12, 0], rotate: [8, 4, 8] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      className={styles.floatingNoble}
    >
      <span>♛</span>
      <strong>3</strong>
    </motion.div>
  </>
);

const YinshVisual = () => (
  <>
    <motion.div
      initial={{ scale: 0.82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.yinshMockup}`}
    >
      <div className={styles.yinshUI}>
        <div className={styles.yinshHeader}><span>YOUR TURN</span><b>2 / 3</b></div>
        <div className={styles.yinshBoard}>
          <div className={styles.yinshGrid}>
            {Array.from({ length: 49 }, (_, index) => <i key={index} />)}
          </div>
          <span className={`${styles.homeRing} ${styles.ringWhite} ${styles.ringOne}`} />
          <span className={`${styles.homeRing} ${styles.ringBlack} ${styles.ringTwo}`} />
          <span className={`${styles.homeRing} ${styles.ringWhite} ${styles.ringThree}`} />
          <span className={`${styles.homeMarker} ${styles.markerBlack} ${styles.markerOne}`} />
          <span className={`${styles.homeMarker} ${styles.markerWhite} ${styles.markerTwo}`} />
          <span className={`${styles.homeMarker} ${styles.markerBlack} ${styles.markerThree}`} />
        </div>
        <div className={styles.yinshFooter}><span>85 INTERSECTIONS</span><span>3 RINGS · VICTORY</span></div>
      </div>
    </motion.div>
    <motion.div animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingRing} ${styles.light}`} />
    <motion.div animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingRing} ${styles.dark}`} />
  </>
);

const OthelloVisual = () => {
  const discs: Record<number, 'black' | 'white'> = {
    19: 'black',
    26: 'white',
    27: 'black',
    28: 'black',
    29: 'white',
    34: 'white',
    35: 'black',
    36: 'white',
    37: 'white',
    44: 'black',
  };
  return <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: 3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.othelloMockup}`}
    >
      <div className={styles.othelloUI}>
        <div className={styles.othelloHeader}><span>YOUR TURN</span><b>BLACK · 06</b></div>
        <div className={styles.othelloBoard}>{Array.from({ length: 64 }, (_, index) =>
          <i key={index}>{discs[index] && <span className={styles[discs[index]]} />}</i>)}</div>
        <div className={styles.othelloFooter}><span>8 × 8 CLASSIC</span><span>EVERY MOVE MATTERS</span></div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingOthelloDisc} ${styles.black}`} />
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingOthelloDisc} ${styles.white}`} />
  </>;
};

const QuoridorVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.quoridorMockup}`}
    >
      <div className={styles.quoridorUI}>
        <div className={styles.quoridorHeader}>
          <span>YOUR NEXT STEP</span><b>SOUTH · 10 WALLS</b>
        </div>
        <div className={styles.quoridorBoard}>
          {Array.from({ length: 81 }, (_, index) =>
            <i key={index}>
              {index === 4 && <span className={styles.northPawn} />}
              {index === 76 && <span className={styles.southPawn} />}
            </i>)}
          <span className={`${styles.homeWall} ${styles.wallOne}`} />
          <span className={`${styles.homeWall} ${styles.wallTwo}`} />
          <span className={`${styles.homeWall} ${styles.wallThree}`} />
        </div>
        <div className={styles.quoridorFooter}>
          <span>9 × 9 CLASSIC</span><span>EVERY WALL · A NEW WAY</span>
        </div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingQuoridorPawn} ${styles.southPawn}`} />
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={styles.floatingQuoridorWall} />
  </>
);


const WarChestVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: 3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.warChestMockup}`}
    >
      <div className={styles.warChestUI}>
        <div className={styles.warChestHeader}><span>ROUND 04</span><b>YOUR COMMAND</b></div>
        <div className={styles.warChestBoard}>{Array.from({ length: 37 }, (_, index) =>
          <i key={index} className={[7, 13, 18, 23, 29].includes(index) ? styles.location : ''}>
            {[9, 17, 25].includes(index) && <span className={index === 25 ? styles.falconCoin : ''}><Swords size={12} /></span>}
          </i>)}</div>
        <div className={styles.warChestCommands}>
          <span><Swords size={15} /></span><span><Flag size={15} /></span><span><Crown size={15} /></span>
        </div>
        <div className={styles.warChestFooter}><span>37 HEXES · 10 LOCATIONS</span><span>6 FLAGS TO VICTORY</span></div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingWarCoin} ${styles.oakCoin}`}><Swords size={27} /></motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingWarCoin} ${styles.falconCoin}`}><Flag size={27} /></motion.span>
  </>
);

const FugitiveVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.fugitiveMockup}`}
    >
      <div className={styles.fugitiveUI}>
        <div className={styles.fugitiveHeader}><span>THE ESCAPE ROUTE</span><b>09 · 42</b></div>
        <div className={styles.fugitiveRoute}>
          {[0, 7, -1, 18, -1, 31, 42].map((number, index) =>
            <span key={`${number}-${index}`} className={number < 0 ? styles.hidden : ''}>
              <small>{index === 0 ? 'START' : index === 6 ? 'ESCAPE' : `0${index}`}</small>
              <b>{number < 0 ? '?' : String(number).padStart(2, '0')}</b>
              {number < 0 && <i />}
            </span>)}
        </div>
        <div className={styles.fugitiveDecks}>
          <span><b>Ⅰ</b>04—14</span><span><b>Ⅱ</b>15—28</span><span><b>Ⅲ</b>29—41</span>
        </div>
        <div className={styles.fugitiveFooter}><span>HIDE · SPRINT · ESCAPE</span><span>2 PLAYERS</span></div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-9, -5, -9] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingFugitiveCard} ${styles.routeCard}`}>27</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingFugitiveCard} ${styles.clueCard}`}>?</motion.span>
  </>
);

export default function Home() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<GameKey>('acquire');
  const activeGame = useMemo(() => gameConfigs.find(game => game.key === activeKey) ?? gameConfigs[0], [activeKey]);
  const themeMap = {
    acquire: styles.themeAcquire,
    davinci: styles.themeDavinci,
    splendor: styles.themeSplendor,
    yinsh: styles.themeYinsh,
    othello: styles.themeOthello,
    quoridor: styles.themeQuoridor,
    warchest: styles.themeWarChest,
    fugitive: styles.themeFugitive,
  } as const;
  const tabThemeMap = {
    acquire: styles.gameTabAcquire,
    davinci: styles.gameTabDavinci,
    splendor: styles.gameTabSplendor,
    yinsh: styles.gameTabYinsh,
    othello: styles.gameTabOthello,
    quoridor: styles.gameTabQuoridor,
    warchest: styles.gameTabWarChest,
    fugitive: styles.gameTabFugitive,
  } as const;
  const themeClass = themeMap[activeGame.key];

  return (
    <div className={`${styles.posterContainer} ${themeClass}`}>
      <div className={styles.backgroundDecor}>
        <div className={styles.glowTop} />
        <div className={styles.glowBottom} />
        <div className={styles.gridOverlay} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.posterCard}
      >
        <div className={styles.gameSwitcher} aria-label="选择游戏">
          {gameConfigs.map(game => {
            const selected = game.key === activeGame.key;
            return (
              <button
                key={game.key}
                type="button"
                className={`${styles.gameTab} ${tabThemeMap[game.key]} ${selected ? styles.active : ''}`}
                onClick={() => setActiveKey(game.key)}
              >
                <span className={styles.tabText}>
                  <span className={styles.tabTitle}>{game.tabTitle}</span>
                  <span className={styles.tabSubtitle}>{game.tabSubtitle}</span>
                </span>
                <span className={styles.tabStatus}>{game.tabStatus}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.posterBody}>
          <div className={styles.contentArea}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeGame.key}-content`}
                initial={{ x: -18, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 18, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className={styles.contentMotion}
              >
                <div className={styles.badge}>
                  <TrendingUp size={14} />
                  {activeGame.badge}
                </div>

                <h1 className={styles.title}>
                  {activeGame.title} <br />
                  <span className={styles.gradientText}>{activeGame.subtitle}</span>
                </h1>

                <p className={styles.description}>{activeGame.description}</p>

                <div className={styles.featuresGrid}>
                  {activeGame.features.map((item, i) => (
                    <motion.div
                      key={`${activeGame.key}-${item.title}`}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08 + i * 0.05 }}
                      className={styles.featureItem}
                    >
                      <div className={styles.iconWrapper}>{item.icon}</div>
                      <div>
                        <h3 className={styles.featureTitle}>{item.title}</h3>
                        <p className={styles.featureDesc}>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.primaryBtn} onClick={() => navigate(activeGame.route)}>
                    {activeGame.cta}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.visualArea}>
            <AnimatePresence mode="wait">
              <motion.div key={`${activeGame.key}-visual`} className={styles.visualMotion}>
                {activeGame.key === 'acquire'
                  ? <AcquireVisual />
                  : activeGame.key === 'davinci'
                    ? <DaVinciVisual />
                    : activeGame.key === 'splendor'
                      ? <SplendorVisual />
                      : activeGame.key === 'yinsh'
                        ? <YinshVisual />
                        : activeGame.key === 'othello'
                          ? <OthelloVisual />
                          : activeGame.key === 'quoridor'
                            ? <QuoridorVisual />
                          : activeGame.key === 'warchest'
                            ? <WarChestVisual />
                            : <FugitiveVisual />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className={styles.footerBranding}>
        {activeGame.footer} · GameBus Online
      </div>
    </div>
  );
}
