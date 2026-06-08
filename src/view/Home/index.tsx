import { useMemo, useState } from 'react';
import styles from './index.module.less';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Brain,
  Cpu,
  EyeOff,
  Hash,
  Monitor,
  Puzzle,
  Smartphone,
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

export default function Home() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<GameKey>('acquire');
  const activeGame = useMemo(() => gameConfigs.find(game => game.key === activeKey) ?? gameConfigs[0], [activeKey]);
  const themeClass = activeGame.key === 'acquire' ? styles.themeAcquire : styles.themeDavinci;

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
                className={`${styles.gameTab} ${game.key === 'acquire' ? styles.gameTabAcquire : styles.gameTabDavinci} ${selected ? styles.active : ''}`}
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
                {activeGame.key === 'acquire' ? <AcquireVisual /> : <DaVinciVisual />}
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
