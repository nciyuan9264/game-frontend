import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Popover } from 'antd';
import styles from './index.module.less';
import wechatGroupQr from '../../assets/wechat-group-qr.jpg';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Crown,
  Move,
  Puzzle,
  Search,
  Sparkles,
  Swords,
  Flag,
  Flower2,
  Gavel,
  Heart,
  Home as HomeIcon,
  Mail,
  MessageCircle,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  featuredGameKey,
  gameCatalog,
  gameCategories,
  type GameCatalogItem,
  type GameCategory,
  type GameCategoryFilter,
  type GameKey,
} from '../../model/gameCatalog';

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

const OnitamaVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: 3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.onitamaMockup}`}
    >
      <div className={styles.onitamaUI}>
        <div className={styles.onitamaHeader}>
          <span>THE NEXT MOVE</span><b>BLUE TO PLAY</b>
        </div>
        <div className={styles.onitamaOpponentCards}>
          <span>龙</span><span>象</span>
        </div>
        <div className={styles.onitamaBoard}>
          {Array.from({ length: 25 }, (_, index) =>
            <i key={index} className={index === 2 || index === 22 ? styles.templeCell : ''}>
              {(index < 5 || index >= 20) && <span className={[
                styles.onitamaPiece,
                index < 5 ? styles.redPiece : styles.bluePiece,
                index === 2 || index === 22 ? styles.masterPiece : '',
              ].filter(Boolean).join(' ')} />}
            </i>)}
        </div>
        <div className={styles.onitamaCards}>
          <span>虎</span><span>鹤</span><b>蟹</b>
        </div>
        <div className={styles.onitamaFooter}>
          <span>5 × 5 · 16 MOVES</span><span>TWO WAYS TO WIN</span>
        </div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingOnitamaCard} ${styles.tigerCard}`}>虎</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingOnitamaCard} ${styles.craneCard}`}>鹤</motion.span>
  </>
);

const HexVisual = () => {
  const stones: Record<number, 'red' | 'teal'> = {
    3: 'red',
    10: 'red',
    17: 'red',
    24: 'red',
    31: 'red',
    38: 'red',
    21: 'teal',
    22: 'teal',
    23: 'teal',
    25: 'teal',
    26: 'teal',
    27: 'teal',
  };
  return <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.hexMockup}`}
    >
      <div className={styles.hexUI}>
        <div className={styles.hexHeader}>
          <span>YOUR CONNECTION</span><b>RED · NORTH / SOUTH</b>
        </div>
        <div className={styles.hexBoard}>
          {Array.from({ length: 49 }, (_, index) =>
            <i key={index}>{stones[index]
              && <span className={styles[stones[index]]} />}</i>)}
        </div>
        <div className={styles.hexFooter}>
          <span>11 × 11 CLASSIC</span><span>TWO SHORES · ONE PATH</span>
        </div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingHexStone} ${styles.red}`} />
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingHexStone} ${styles.teal}`} />
  </>;
};

const HiveVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.warChestMockup}`}
    >
      <div className={styles.warChestUI}>
        <div className={styles.warChestHeader}>
          <span>WHITE · YOUR MOVE</span><b>ONE HIVE</b>
        </div>
        <div className={styles.warChestBoard}>
          {Array.from({ length: 37 }, (_, index) =>
            <i key={index}
              className={[7, 12, 13, 18, 19, 23, 24, 29].includes(index)
                ? styles.location
                : ''}>
              {[12, 18, 19, 24].includes(index) &&
                <span><Crown size={index === 18 ? 13 : 10} /></span>}
            </i>)}
        </div>
        <div className={styles.warChestCommands}>
          <span><Puzzle size={15} /></span>
          <span><Move size={15} /></span>
          <span><Crown size={15} /></span>
        </div>
        <div className={styles.warChestFooter}>
          <span>22 TILES · NO BOARD</span><span>SURROUND THE QUEEN</span>
        </div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-8, -4, -8] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingWarCoin} ${styles.oakCoin}`}>
      <Puzzle size={27} />
    </motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [9, 4, 9] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingWarCoin} ${styles.falconCoin}`}>
      <Crown size={27} />
    </motion.span>
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

const LoveLetterVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: 3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: -3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.loveLetterMockup}`}
    >
      <div className={styles.loveLetterUI}>
        <div className={styles.loveLetterHeader}><span>THE QUIET COURT</span>
          <b><Heart size={11} /> 02 / 04</b></div>
        <div className={styles.loveLetterCourt}>
          <span><Flower2 size={20} /></span><span><Mail size={22} /></span>
          <span><Flower2 size={20} /></span>
        </div>
        <div className={styles.loveLetterHand}>
          {[1, 4].map(rank => <span key={rank}><b>{rank}</b><i />
            <small>{rank === 1 ? 'GUARD' : 'HANDMAID'}</small></span>)}
        </div>
        <div className={styles.loveLetterFooter}><span>DRAW ONE · PLAY ONE</span>
          <span>21 CARDS</span></div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-9, -5, -9] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingLetterCard} ${styles.letterGuard}`}>1</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingLetterCard} ${styles.letterPrincess}`}>9</motion.span>
  </>
);

const SixNimmtVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={` `}
    >
      <div className={styles.sixNimmtUI}>
        <header><span>ROUND 04 / 10</span><b>18 BULLS</b></header>
        <div className={styles.sixNimmtRows}>{[
          [12, 18, 23], [30, 35, 39, 44], [61, 64], [79, 84, 90],
        ].map((row, index) => <div key={index}><b>{String.fromCharCode(65 + index)}</b>
          <span>{row.map(card => <i key={card}>{card}</i>)}</span><em>6</em></div>)}</div>
        <footer>{[24, 55, 68, 88, 103].map(card => <i key={card}>{card}</i>)}</footer>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-9, -5, -9] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={` `}>24</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={` `}>55</motion.span>
  </>
);

const CantStopVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={` `}
    >
      <div className={styles.sixNimmtUI}>
        <header><span>TURN 07</span><b>3 ROUTES</b></header>
        <div className={styles.sixNimmtRows}>{[
          [2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 12],
        ].map((row, index) => <div key={index}><b>{index + 1}</b>
          <span>{row.map(route => <i key={route}>{route}</i>)}</span><em>▲</em></div>)}</div>
        <footer>{[1, 3, 4, 6].map((die, index) => <i key={index}>{die}</i>)}</footer>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-9, -5, -9] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={` `}>7</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={` `}>▲</motion.span>
  </>
);

const ForSaleVisual = () => (
  <>
    <motion.div
      initial={{ scale: .82, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: .92, opacity: 0, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className={`${styles.mockup} ${styles.loveLetterMockup}`}
    >
      <div className={styles.loveLetterUI}>
        <div className={styles.loveLetterHeader}><span>THE SUNDAY AUCTION</span>
          <b><Gavel size={11} /> 03 / 07</b></div>
        <div className={styles.loveLetterCourt}>
          <span><HomeIcon size={20} /></span><span><Gavel size={22} /></span>
          <span><HomeIcon size={20} /></span>
        </div>
        <div className={styles.loveLetterHand}>
          {[7, 24].map(rank => <span key={rank}><b>{rank}</b><i />
            <small>{rank === 7 ? 'COTTAGE' : 'ESTATE'}</small></span>)}
        </div>
        <div className={styles.loveLetterFooter}><span>BUY LOW · SELL SMART</span>
          <span>30 PROPERTIES</span></div>
      </div>
    </motion.div>
    <motion.span animate={{ y: [0, -11, 0], rotate: [-9, -5, -9] }}
      transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
      className={`${styles.floatingLetterCard} ${styles.letterGuard}`}>12</motion.span>
    <motion.span animate={{ y: [0, 11, 0], rotate: [10, 5, 10] }}
      transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: .4 }}
      className={`${styles.floatingLetterCard} ${styles.letterPrincess}`}>$15K</motion.span>
  </>
);

const gameVisuals: Record<GameKey, () => JSX.Element> = {
  acquire: AcquireVisual,
  davinci: DaVinciVisual,
  splendor: SplendorVisual,
  yinsh: YinshVisual,
  othello: OthelloVisual,
  hex: HexVisual,
  quoridor: QuoridorVisual,
  onitama: OnitamaVisual,
  hive: HiveVisual,
  warchest: WarChestVisual,
  fugitive: FugitiveVisual,
  loveletter: LoveLetterVisual,
  sixnimmt: SixNimmtVisual,
  cantstop: CantStopVisual,
  forsale: ForSaleVisual,
};

type GameThemeStyle = CSSProperties & {
  '--accent-primary': string;
  '--accent-secondary': string;
  '--accent-soft': string;
  '--accent-border': string;
};

function gameThemeStyle(game: GameCatalogItem): GameThemeStyle {
  return {
    '--accent-primary': game.theme.primary,
    '--accent-secondary': game.theme.secondary,
    '--accent-soft': game.theme.soft,
    '--accent-border': game.theme.border,
  };
}

function gameMatchesCategory(game: GameCatalogItem, category: GameCategoryFilter) {
  return category === 'all' || (game.categories as readonly GameCategory[]).includes(category);
}

function gameMatchesQuery(game: GameCatalogItem, query: string) {
  if (!query) return true;

  return [
    game.title,
    game.englishTitle,
    game.status,
    game.badge,
    game.description,
    game.players,
    game.duration,
    game.difficulty,
    game.tags.join(' '),
    game.features.map(feature => `${feature.title} ${feature.desc}`).join(' '),
  ].join(' ').toLowerCase().includes(query);
}

export default function Home() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<GameKey>(featuredGameKey);
  const [selectedCategory, setSelectedCategory] = useState<GameCategoryFilter>('all');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const activeGame = useMemo(
    () => gameCatalog.find(game => game.key === activeKey) ?? gameCatalog[0],
    [activeKey],
  );
  const filteredGames = useMemo(
    () => gameCatalog.filter(game => gameMatchesCategory(game, selectedCategory) && gameMatchesQuery(game, normalizedQuery)),
    [normalizedQuery, selectedCategory],
  );
  const ActiveVisual = gameVisuals[activeGame.key];
  const activeThemeStyle = gameThemeStyle(activeGame);
  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className={styles.plazaPage} style={activeThemeStyle}>
      <div className={styles.backgroundDecor}>
        <div className={styles.gridOverlay} />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.plazaShell}
      >
        <header className={styles.topBar}>
          <div className={styles.brandRow}>
            <span>GameBus Online</span>
            <b>{gameCatalog.length} 款游戏</b>
          </div>
          <Popover
            placement="bottomRight"
            trigger="click"
            color="#151e2d"
            classNames={{ root: styles.communityPopover }}
            content={(
              <div className={styles.communityPopoverContent}>
                <div className={styles.communityPopoverTitle}>
                  <span>微信玩家群</span>
                  <strong>桌游线上版</strong>
                </div>
                <a
                  href={wechatGroupQr}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="查看桌游线上版玩家群二维码原图"
                >
                  <img src={wechatGroupQr} alt="桌游线上版微信玩家群二维码" />
                </a>
                <p>约局、反馈与版本更新</p>
              </div>
            )}
          >
            <button type="button" className={styles.communityTrigger}>
              <MessageCircle size={17} />
              <span>玩家群</span>
            </button>
          </Popover>
        </header>

        <section className={styles.heroSection}>
          <div className={styles.heroCopy}>
            <h1>桌游广场</h1>
            <p>
              从商业经营到抽象棋，从隐藏推理到战术调遣，选择当前想玩的规则，直接进入对应大厅。
            </p>
            <div className={styles.heroMetrics} aria-label="平台能力">
              <span><strong>{gameCatalog.length}</strong><small>游戏</small></span>
              <span><strong>AI</strong><small>陪练</small></span>
              <span><strong>Web</strong><small>即开即玩</small></span>
            </div>
          </div>

          <article className={styles.featuredPanel} style={activeThemeStyle}>
            <div className={styles.featuredInfo}>
              <div className={styles.featuredBadge}>
                <Sparkles size={14} />
                {activeGame.badge}
              </div>
              <div>
                <p className={styles.featuredEyebrow}>{activeGame.englishTitle}</p>
                <h2>{activeGame.title}</h2>
              </div>
              <p className={styles.featuredDesc}>{activeGame.description}</p>
              <div className={styles.featuredTags}>
                <span>{activeGame.players}</span>
                <span>{activeGame.duration}</span>
                <span>{activeGame.difficulty}</span>
              </div>
              <div className={styles.featuredActions}>
                <button type="button" className={styles.primaryBtn} onClick={() => navigate(activeGame.route)}>
                  {activeGame.cta}
                  <ArrowRight size={18} />
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={() => navigate(activeGame.guideRoute)}>
                  玩法
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={() => navigate(activeGame.rankingsRoute)}>
                  排行
                </button>
              </div>
              <div className={styles.featuredFeatures}>
                {activeGame.features.slice(0, 3).map(feature => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={feature.title}>
                      <FeatureIcon size={18} />
                      <span>{feature.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.featuredVisual}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeGame.key}-visual`}
                  className={styles.visualMotion}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.24 }}
                >
                  <ActiveVisual />
                </motion.div>
              </AnimatePresence>
            </div>
          </article>
        </section>

        <section className={styles.librarySection}>
          <div className={styles.libraryHeader}>
            <div>
              <p>全部游戏</p>
              <h2>选择一张桌</h2>
            </div>
            <label className={styles.searchBox}>
              <Search size={18} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="搜索游戏、类型或规则"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="清空搜索">
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          <div className={styles.categoryBar} aria-label="游戏分类">
            {gameCategories.map(category => (
              <button
                key={category.key}
                type="button"
                aria-pressed={selectedCategory === category.key}
                className={selectedCategory === category.key ? styles.activeCategory : ''}
                onClick={() => setSelectedCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {filteredGames.length > 0 ? (
            <div className={styles.gameGrid} aria-label="选择游戏">
              {filteredGames.map((game, index) => {
                const PreviewIcon = game.features[0].icon;
                const selected = game.key === activeGame.key;
                return (
                  <motion.article
                    key={game.key}
                    className={`${styles.gameCard} ${selected ? styles.selectedCard : ''}`}
                    style={gameThemeStyle(game)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.025 }}
                  >
                    <button
                      type="button"
                      className={styles.cardPreview}
                      onClick={() => setActiveKey(game.key)}
                      aria-label={`预览${game.title}`}
                    >
                      <span><PreviewIcon size={24} /></span>
                      <b>{game.status}</b>
                    </button>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitleRow}>
                        <div>
                          <p>{game.englishTitle}</p>
                          <h3>{game.title}</h3>
                        </div>
                        <span>{game.difficulty}</span>
                      </div>
                      <p className={styles.cardDesc}>{game.description}</p>
                      <div className={styles.cardTags}>
                        {game.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}
                      </div>
                      <div className={styles.cardMeta}>
                        <span>{game.players}</span>
                        <span>{game.duration}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button type="button" onClick={() => navigate(game.route)}>
                        进入大厅
                        <ArrowRight size={16} />
                      </button>
                      <button type="button" onClick={() => navigate(game.guideRoute)}>玩法</button>
                      <button type="button" onClick={() => navigate(game.rankingsRoute)}>排行</button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>没有匹配的游戏。</p>
              <button type="button" onClick={clearFilters}>重置筛选</button>
            </div>
          )}
        </section>
      </motion.main>
    </div>
  );
}
