import React from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/Modal';

import styles from './index.module.less';

const ruleSections: { title: string; items: string[] }[] = [
  {
    title: '游戏目标',
    items: [
      '通过拿取宝石、购买发展卡积累分数，率先达到 15 分者触发终局，分数最高者获胜。',
    ],
  },
  {
    title: '宝石与拿取',
    items: [
      '每回合可三选一：拿取宝石、购买发展卡或预留发展卡。',
      '拿宝石有两种方式：拿 3 颗不同颜色，或拿 2 颗同色（该色库存需 ≥ 4）。',
      '黄金为万能宝石，只能通过预留发展卡获得，不能主动拿取。',
      '任意时刻手中宝石总数不得超过 10 颗。',
    ],
  },
  {
    title: '购买发展卡',
    items: [
      '用宝石支付卡牌成本即可购买，已拥有的发展卡提供对应颜色的永久折扣。',
      '宝石不足的部分可用黄金抵充。',
      '购得的发展卡计入分数，并作为折扣降低后续购买成本。',
    ],
  },
  {
    title: '预留发展卡',
    items: [
      '可预留场上或牌堆顶的发展卡，最多同时预留 3 张。',
      '预留时若有黄金库存，会获赠 1 枚黄金宝石。',
      '预留的卡仅自己可见并可在之后购买。',
    ],
  },
  {
    title: '贵族',
    items: [
      '当玩家拥有的发展卡折扣满足某位贵族的要求时，回合结束自动获得该贵族。',
      '每位贵族提供额外分数，无需主动操作。',
    ],
  },
  {
    title: '游戏结束',
    items: [
      '当有玩家达到 15 分，本轮结束后进入最后一回合，使每位玩家回合数相同。',
      '终局时分数最高者获胜；同分则以拥有发展卡更少者优先。',
    ],
  },
];

const SplendorRulesModal = ({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Modal visible={visible} onClose={() => setVisible(false)}>
      <div className={styles.root}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>游戏规则</h2>
            <p className={styles.subTitle}>了解 Splendor 玩法</p>
          </div>
          <button
            aria-label="关闭规则"
            onClick={() => setVisible(false)}
            className={styles.closeBtn}
          >
            <X size={22} />
          </button>
        </div>

        <div className={styles.content}>
          {ruleSections.map((section) => (
            <section className={styles.ruleSection} key={section.title}>
              <h3 className={styles.ruleSectionTitle}>{section.title}</h3>
              <ul className={styles.ruleList}>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default SplendorRulesModal;
