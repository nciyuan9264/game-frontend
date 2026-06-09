import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, WsRoomSyncData } from '@/types/DaVinicRoom';
import { CircleHelp, Cpu, RotateCcw, Trophy, User, X } from 'lucide-react';
import TurnCountdown from '@/view/Acquire/components/Game/components/TurnCountdown';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import styles from './index.module.less';

const formatGuessNum = (num: number) => (num === -1 ? 'JOKER' : `${num}`);

const getGuessAction = (lastData?: WsRoomSyncData['roomData']['lastData']) => {
  const payload = lastData?.payload;
  if (
    lastData?.action !== 'guess_card' ||
    !payload ||
    typeof payload.targetCardID !== 'string' ||
    typeof payload.targetPlayerID !== 'string' ||
    typeof payload.guessNum !== 'number' ||
    typeof payload.correct !== 'boolean'
  ) {
    return null;
  }

  return {
    playerID: lastData.playerID,
    payload,
  };
};

const getActionKey = (action: NonNullable<ReturnType<typeof getGuessAction>>) => [
  action.playerID,
  action.payload.targetCardID,
  action.payload.targetPlayerID,
  action.payload.guessNum,
  action.payload.correct ? '1' : '0',
].join(':');

const getGameStatusLabel = (
  status: WsRoomSyncData['roomData']['gameStatus'] | undefined,
  isPlayerTurn: boolean
) => {
  if (!status) return '同步中';

  switch (status) {
    case 'waiting':
      return '等待中';
    case 'getCard':
      return isPlayerTurn ? '抽取新牌' : '对手抽牌';
    case 'guessCard':
      return isPlayerTurn ? '猜测密码' : '对手猜牌';
    case 'setCard':
      return isPlayerTurn ? '选择行动' : '对手选择';
    case 'end':
      return '游戏结束';
    case 'match':
      return '准备阶段';
    default:
      return isPlayerTurn ? '你的回合' : '对手回合';
  }
};

const ruleSections = [
  {
    title: '游戏目标',
    items: [
      '破解对手的密码序列。谁先让对手所有密码牌公开，谁就获胜。',
      '自己的牌被全部公开则失败，尽量用试探和排除保护自己的序列。',
    ],
  },
  {
    title: '牌组与排序',
    items: [
      '本房间是 2 人版，开局每人 5 张。',
      '牌面包含黑、白两色的 0-11，以及 JOKER。',
      '自己的密码牌按从小到大排列；同数字时白牌在前、黑牌在后，因为黑大于白。',
      'JOKER 不受顺序限制，可以放在任意位置。',
    ],
  },
  {
    title: '回合流程',
    items: [
      '轮到你时，先从中间牌池抽一张牌。',
      '随后选择对手一张未公开的牌，猜它是 0-11 或 JOKER。',
      '猜对后会进入“选择行动”：你可以继续猜对手暗牌，也可以点击“放回”把新牌放入自己的序列。',
    ],
  },
  {
    title: '猜牌结果',
    items: [
      '猜对：目标牌公开，并且你可以继续掌握主动。',
      '猜错：不会公开目标牌的真实数字；你会失去主动权，按提示处理自己刚抽到的牌后轮到对手。',
      '最近一次猜牌会显示在顶部提示条，绿色代表猜对，红色代表猜错。',
    ],
  },
];

const ruleMeta = [
  { label: '人数', value: '2 人' },
  { label: '开局', value: '每人 5 张' },
  { label: '数字', value: '0-11' },
  { label: '特殊牌', value: 'JOKER' },
];

interface IGameProps {
  sendMessage: (msg: string) => void;
  wsRef: React.RefObject<WebSocket>;
  wsRoomSyncData?: WsRoomSyncData;
  userID: string;
  gameEndModalVisible: boolean;
  setGameEndModalVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export const Game: FC<IGameProps> = ({ sendMessage, wsRef: _wsRef, wsRoomSyncData, userID, gameEndModalVisible: _gev, setGameEndModalVisible: _setGev }: IGameProps) => {
  const [selectedGuessTile, setSelectedGuessTile] = useState<Card | null>(null);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  const lastActionKeyRef = useRef<string | null | undefined>(undefined);
  const winner = useMemo<'player' | 'opponent' | null>(() => {
    if (wsRoomSyncData?.roomData.gameStatus !== 'end') return null;
    const selfAll = wsRoomSyncData?.cardData?.self ?? [];
    if (selfAll.some(c => !c.isRevealed)) return 'player';
    return 'opponent';
  }, [wsRoomSyncData]);
  useEffect(() => {
    setShowEndModal(Boolean(winner));
  }, [winner]);
  const isPlayerTurn = wsRoomSyncData?.roomData.currentPlayer === userID;
  const statusLabel = useMemo(
    () => getGameStatusLabel(wsRoomSyncData?.roomData.gameStatus, Boolean(isPlayerTurn)),
    [wsRoomSyncData?.roomData.gameStatus, isPlayerTurn]
  );
  // Check for winner whenever game state changes
  // useEffect(() => {
  //   const gameWinner = checkWinner(gameState);
  //   if (gameWinner && !winner) {
  //     setWinner(gameWinner);
  //   }
  // }, [gameState]);

  useEffect(() => {
    sendMessage(JSON.stringify({
      type: 'game_ready',
    }));
  }, [])

  const lastGuessView = useMemo(() => {
    const action = getGuessAction(wsRoomSyncData?.roomData.lastData);
    if (!action) return null;

    const { payload } = action;
    const isActorSelf = action.playerID === userID;
    const isTargetSelf = payload.targetPlayerID === userID;
    const targetCards = isTargetSelf ? (wsRoomSyncData?.cardData?.self ?? []) : (wsRoomSyncData?.cardData?.opponents ?? []);
    const targetCard = targetCards.find(card => card.id === payload.targetCardID);
    const targetIndex = targetCard
      ? typeof targetCard.index === 'number' && targetCard.index >= 0
        ? targetCard.index + 1
        : targetCards.findIndex(card => card.id === payload.targetCardID) + 1
      : 0;
    const targetLabel = targetCard
      ? `${targetCard.color ? '白牌' : '黑牌'}${targetIndex > 0 ? ` #${targetIndex}` : ''}`
      : '目标牌';
    const targetOwnerLabel = isTargetSelf ? '你的' : '对手的';
    const guessNumText = formatGuessNum(payload.guessNum);

    let text = '';
    if (payload.correct) {
      text = isActorSelf
        ? `你猜${targetOwnerLabel}${targetLabel}为 ${guessNumText}，猜对了`
        : `对手猜${targetOwnerLabel}${targetLabel}为 ${guessNumText}，猜对了`;
      if (isActorSelf && wsRoomSyncData?.roomData.gameStatus === 'setCard') {
        text = `${text}，可继续猜或点击“放回”结束回合`;
      }
    } else {
      text = isActorSelf
        ? `你猜${targetOwnerLabel}${targetLabel}为 ${guessNumText}，猜错了`
        : `对手猜${targetOwnerLabel}${targetLabel}为 ${guessNumText}，猜错了`;
    }

    return {
      key: getActionKey(action),
      correct: payload.correct,
      text,
      badgeText: payload.correct ? '猜对' : '猜错',
      tone: payload.correct ? 'correct' : 'wrong',
    };
  }, [userID, wsRoomSyncData]);

  const actionPromptView = useMemo(() => {
    const status = wsRoomSyncData?.roomData.gameStatus;
    if (!isPlayerTurn) return null;

    switch (status) {
      case 'getCard':
        return {
          key: 'prompt:getCard',
          badgeText: '提示',
          text: '点击中间牌池抽一张牌',
          tone: 'info',
        };
      case 'guessCard':
        return {
          key: 'prompt:guessCard',
          badgeText: '提示',
          text: '点击对手未公开的牌进行猜测',
          tone: 'info',
        };
      case 'setCard':
        return {
          key: 'prompt:setCard',
          badgeText: '可继续',
          text: '继续猜对手暗牌，或点击“放回”结束回合',
          tone: 'correct',
        };
      default:
        return null;
    }
  }, [isPlayerTurn, wsRoomSyncData?.roomData.gameStatus]);

  const topbarMessageView = lastGuessView ?? actionPromptView;

  useEffect(() => {
    const action = getGuessAction(wsRoomSyncData?.roomData.lastData);
    if (!action) {
      lastActionKeyRef.current = null;
      return;
    }

    const actionKey = getActionKey(action);
    if (lastActionKeyRef.current === actionKey) return;

    if (lastActionKeyRef.current === undefined) {
      lastActionKeyRef.current = actionKey;
      return;
    }

    lastActionKeyRef.current = actionKey;
    const { payload } = action;
    gameCanvasRef.current?.flashTileFeedback(payload.targetCardID, payload.correct);
  }, [wsRoomSyncData?.roomData.lastData]);

  const handleTileClick = useCallback((tileId: string) => {
    const poolCards = Object.values(wsRoomSyncData?.roomData.boardCards ?? {});
    const opponentCards = wsRoomSyncData?.cardData?.opponents ?? [];

    const poolHit = poolCards.find((c) => c.id === tileId);
    const opponentHit = opponentCards.find((c) => c.id === tileId);

    if (opponentHit) {
      setSelectedGuessTile(opponentHit);
      setShowGuessModal(true);
      return;
    }

    if (poolHit) {
      sendMessage(JSON.stringify({
        type: 'game_get_card',
        payload: {
          id: tileId,
        },
      }));
      console.log('[Game] get card from pool:', tileId);
      return;
    }
  }, [wsRoomSyncData, sendMessage]);

  const handleGuess = useCallback((value: number) => {
    sendMessage(JSON.stringify({
      type: 'game_guess_card',
      payload: {
        id: selectedGuessTile?.id,
        num: value,
      },
    }));
    setShowGuessModal(false);
    setSelectedGuessTile(null);
  }, [selectedGuessTile, sendMessage]);

  const resetGame = () => {
    sendMessage(JSON.stringify({
      type: 'game_restart_game',
      payload: {},
    }));
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={() => setShowRuleModal(true)}
            className={styles.ruleTrigger}
            aria-label="查看游戏规则"
          >
            <CircleHelp className={styles.ruleTriggerIcon} />
            <span className={styles.ruleTriggerText}>规则</span>
          </button>
          <div className={styles.statusDesktop}>
            <User className={styles.iconUser} />
            <span className={styles.label}>Player</span>
            <div className={styles.divider} />
            <span className={styles.vsMono}>VS</span>
            <div className={styles.divider} />
            <Cpu className={styles.iconCpu} />
            <span className={styles.label}>AI Alpha</span>
          </div>
          {!winner && (
            <div className={styles.headerStatus}>
              <div className={`${styles.statusDot} ${isPlayerTurn ? styles.statusDotPlayer : styles.statusDotAI}`} />
              <p className={styles.statusText}>{statusLabel}</p>
            </div>
          )}
          {!winner && (
            <div className={`${styles.headerInfo} ${styles.turnTimer}`}>
              <span className={styles.infoLabel}>Time</span>
              {wsRoomSyncData?.roomData.gameStatus && wsRoomSyncData.roomData.gameStatus !== 'end' && wsRoomSyncData.roomData.turnDeadline ? (
                <TurnCountdown
                  bare
                  secondsOnly
                  deadline={wsRoomSyncData.roomData.turnDeadline}
                  className={styles.turnCountdown}
                />
              ) : (
                <span className={styles.infoCount}>--</span>
              )}
            </div>
          )}
          {winner && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className={styles.resetBtn}
            >
              <RotateCcw className={styles.resetIcon} />
            </button>
          )}
        </div>
        <AnimatePresence>
          {topbarMessageView && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`${styles.lastActionPanel} ${topbarMessageView.tone === 'correct' ? styles.lastActionPanelCorrect : topbarMessageView.tone === 'wrong' ? styles.lastActionPanelWrong : styles.lastActionPanelInfo}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`badge:${topbarMessageView.key}:${topbarMessageView.badgeText}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className={styles.lastActionBadge}
                >
                  {topbarMessageView.badgeText}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`text:${topbarMessageView.key}:${topbarMessageView.text}`}
                  initial={{ opacity: 0, y: 5, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -5, filter: 'blur(3px)' }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={styles.lastActionText}
                >
                  {topbarMessageView.text}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className={styles.main}>
        <div className={styles.board}>
          <GameCanvas
            ref={gameCanvasRef}
            playerHand={(wsRoomSyncData?.cardData?.self) ?? []}
            opponentHand={(wsRoomSyncData?.cardData?.opponents) ?? []}
            pool={(Object.values(wsRoomSyncData?.roomData.boardCards ?? {}) || []) as Card[]}
            isPlayerTurn={Boolean(isPlayerTurn)}
            gameStatus={(wsRoomSyncData?.roomData.gameStatus) ?? 'waiting'}
            onTileClick={handleTileClick}
            onSelectInsertPosition={(index, tileId) => {
              sendMessage(JSON.stringify({
                type: 'game_set_card',
                payload: {
                  id: tileId,
                  index: index,
                },
              }));
            }}
          />
        </div>
      </main>

      {/* Guess Modal */}
      <AnimatePresence>
        {showGuessModal && !winner && (
          <div className={styles.modalWrapper}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalBackdrop}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={styles.modalCard}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>猜测密码牌</h2>
                <p className={styles.modalDesc}>选择你认为这张{selectedGuessTile?.color ? '白牌' : '黑牌'}的数字</p>
              </div>

              <div className={styles.guessGrid}>
                {[...Array(12).keys()].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleGuess(num)}
                    className={styles.guessButton}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleGuess(-1)}
                  className={styles.jokerButton}
                >
                  JOKER (-)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowGuessModal(false)}
                className={styles.cancelButton}
              >
                取消
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rule Modal */}
      <AnimatePresence>
        {showRuleModal && (
          <div className={styles.modalWrapper}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.modalBackdrop}
              onClick={() => setShowRuleModal(false)}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 18 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={styles.ruleModalCard}
              role="dialog"
              aria-modal="true"
              aria-labelledby="davinci-rules-title"
            >
              <div className={styles.ruleHero}>
                <div className={styles.ruleHeroIcon}>
                  <CircleHelp className={styles.ruleHeroIconSvg} />
                </div>
                <div className={styles.ruleHeroText}>
                  <span className={styles.ruleEyebrow}>2 人推理版</span>
                  <h2 id="davinci-rules-title" className={styles.ruleModalTitle}>游戏规则</h2>
                  <p className={styles.ruleModalDesc}>观察、试探、排除，在不暴露自己的前提下破解对手的密码序列。</p>
                </div>
              </div>

              <div className={styles.ruleMetaGrid}>
                {ruleMeta.map(item => (
                  <div className={styles.ruleMetaItem} key={item.label}>
                    <span className={styles.ruleMetaLabel}>{item.label}</span>
                    <span className={styles.ruleMetaValue}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className={styles.ruleSectionList}>
                {ruleSections.map(section => (
                  <section className={styles.ruleSection} key={section.title}>
                    <h3 className={styles.ruleSectionTitle}>{section.title}</h3>
                    <ul className={styles.ruleList}>
                      {section.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className={styles.ruleCloseButton}
              >
                知道了
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory Modal */}
      <AnimatePresence>
        {winner && showEndModal && (
          <div className={styles.modalWrapper}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.victoryBackdrop}
              onClick={() => setShowEndModal(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={styles.victoryCard}
            >
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className={styles.victoryClose}
                aria-label="关闭"
              >
                <X className={styles.victoryCloseIcon} />
              </button>
              <div className={styles.victoryHeader}>
                <div className={`${styles.victoryIcon} ${winner === 'player' ? styles.victoryPlayer : styles.victoryAI}`}>
                  <Trophy className={`${styles.trophyIcon} ${winner === 'player' ? styles.trophyPlayer : styles.trophyAI}`} />
                </div>
              </div>

              <h2 className={styles.victoryTitle}>
                {winner === 'player' ? 'Victory!' : 'Game Over'}
              </h2>

              <p className={styles.victoryDesc}>
                {winner === 'player'
                  ? 'Congratulations! You have revealed all of your opponent\'s tiles!'
                  : 'The AI has revealed all of your tiles. Better luck next time!'}
              </p>

              <div className={styles.victoryActions}>
                <button
                  type="button"
                  onClick={resetGame}
                  className={styles.playAgainBtn}
                >
                  <RotateCcw className={styles.playAgainIcon} />
                  Play Again
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
