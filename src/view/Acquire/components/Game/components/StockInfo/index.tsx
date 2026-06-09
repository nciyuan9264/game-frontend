import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/Modal';

import styles from './index.module.less';

type StockInfo = {
  range: [number, number];
  price: number;
  majorityBonus: number;
  minorityBonus: number;
};

type StockDataMap = Record<string, StockInfo[]>;

const stockData: StockDataMap = {
  'Continental/Imperial': [
    { range: [2, 2], price: 400, majorityBonus: 4000, minorityBonus: 2000 },
    { range: [3, 3], price: 500, majorityBonus: 5000, minorityBonus: 2500 },
    { range: [4, 4], price: 600, majorityBonus: 6000, minorityBonus: 3000 },
    { range: [5, 5], price: 700, majorityBonus: 7000, minorityBonus: 3500 },
    { range: [6, 10], price: 800, majorityBonus: 8000, minorityBonus: 4000 },
    { range: [11, 20], price: 900, majorityBonus: 9000, minorityBonus: 4500 },
    { range: [21, 30], price: 1400, majorityBonus: 10000, minorityBonus: 5000 },
    { range: [31, 40], price: 1700, majorityBonus: 11000, minorityBonus: 5500 },
    { range: [41, 1000], price: 2000, majorityBonus: 12000, minorityBonus: 6000 },
  ],
  'American/Festival/Worldwide': [
    { range: [2, 2], price: 300, majorityBonus: 3000, minorityBonus: 1500 },
    { range: [3, 3], price: 400, majorityBonus: 4000, minorityBonus: 2000 },
    { range: [4, 4], price: 500, majorityBonus: 5000, minorityBonus: 2500 },
    { range: [5, 5], price: 600, majorityBonus: 6000, minorityBonus: 3000 },
    { range: [6, 10], price: 700, majorityBonus: 7000, minorityBonus: 3500 },
    { range: [11, 20], price: 800, majorityBonus: 8000, minorityBonus: 4000 },
    { range: [21, 30], price: 1300, majorityBonus: 9000, minorityBonus: 4500 },
    { range: [31, 40], price: 1600, majorityBonus: 10000, minorityBonus: 5000 },
    { range: [41, 1000], price: 1900, majorityBonus: 11000, minorityBonus: 5500 },
  ],
  'Tower/Sackson': [
    { range: [2, 2], price: 200, majorityBonus: 2000, minorityBonus: 1000 },
    { range: [3, 3], price: 300, majorityBonus: 3000, minorityBonus: 1500 },
    { range: [4, 4], price: 400, majorityBonus: 4000, minorityBonus: 2000 },
    { range: [5, 5], price: 500, majorityBonus: 5000, minorityBonus: 2500 },
    { range: [6, 10], price: 600, majorityBonus: 6000, minorityBonus: 3000 },
    { range: [11, 20], price: 700, majorityBonus: 7000, minorityBonus: 3500 },
    { range: [21, 30], price: 1200, majorityBonus: 8000, minorityBonus: 4000 },
    { range: [31, 40], price: 1500, majorityBonus: 9000, minorityBonus: 4500 },
    { range: [41, 1000], price: 1800, majorityBonus: 10000, minorityBonus: 5000 },
  ],
};

const ruleSections: { title: string; items: string[] }[] = [
  {
    title: '游戏目标',
    items: [
      '通过建立、扩张、合并公司并持有股票，在游戏结束时拥有最多资产者获胜。',
    ],
  },
  {
    title: '放置地块',
    items: [
      '每回合先在棋盘放置一块地块。',
      '相邻地块连成片，可组建新公司或扩张已有公司。',
    ],
  },
  {
    title: '创建公司',
    items: [
      '当放置使两块以上地块相连且尚无公司时，可创建一家新公司。',
      '创建者获赠 1 股创始股。',
    ],
  },
  {
    title: '购买股票',
    items: [
      '每回合最多购买 3 股在场公司的股票。',
      '股票价格随公司规模（地块数）上涨。',
    ],
  },
  {
    title: '公司合并',
    items: [
      '当一块地块连接两家公司时，较大公司吞并较小公司。',
      '被并方的大股东、二股东获得奖金。',
      '所持被并方股票可兑现、保留，或按 2:1 换购存续公司的股票。',
    ],
  },
  {
    title: '游戏结束与清算',
    items: [
      '当某公司达到 41 格，或所有在场公司都已「安全」（≥11 格）时可结束。',
      '结算各公司大、二股东奖金，并按持股变现，资产最高者获胜。',
    ],
  },
];

const CompanyStockInfoModal = ({
  visible,
  setCompanyInfoVisible,
}: {
  visible: boolean;
  setCompanyInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [activeSection, setActiveSection] = useState<'rules' | 'stock'>('rules');
  const [activeTab, setActiveTab] = useState<string>('Continental/Imperial');

  return (
    <Modal
      visible={visible}
      onClose={() => setCompanyInfoVisible(false)}
    >
      <div className={styles.header}>
        <div>
          <h2>{activeSection === 'rules' ? '游戏规则' : '公司股票信息'}</h2>
          <p className={styles.subTitle}>
            {activeSection === 'rules' ? '了解 Acquire 玩法' : '查看股票价格和奖励信息'}
          </p>
        </div>
        <button aria-label="Close modal" onClick={() => setCompanyInfoVisible(false)} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.segmented}>
          <button
            type="button"
            className={`${styles.segment} ${activeSection === 'rules' ? styles.segmentActive : ''}`}
            onClick={() => setActiveSection('rules')}
          >
            游戏规则
          </button>
          <button
            type="button"
            className={`${styles.segment} ${activeSection === 'stock' ? styles.segmentActive : ''}`}
            onClick={() => setActiveSection('stock')}
          >
            公司股票信息
          </button>
        </div>

        {activeSection === 'rules' ? (
          <div className={styles.ruleSectionList}>
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
        ) : (
          <>
            <div className={styles.tabs}>
              {Object.keys(stockData).map((companyName) => (
                <button
                  key={companyName}
                  className={`${styles.tab} ${activeTab === companyName ? styles.active : ''}`}
                  onClick={() => setActiveTab(companyName)}
                >
                  {companyName}
                </button>
              ))}
            </div>

            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>地块数量区间</th>
                    <th>股票价格</th>
                    <th>大股东奖励</th>
                    <th>二股东奖励</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData[activeTab].map((item, index) => (
                    <tr key={index}>
                      <td>{item.range[0]} - {item.range[1]}</td>
                      <td>${item.price}</td>
                      <td>${item.majorityBonus}</td>
                      <td>${item.minorityBonus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CompanyStockInfoModal;
