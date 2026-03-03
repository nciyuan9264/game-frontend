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

const CompanyStockInfoModal = ({
  visible,
  setCompanyInfoVisible,
}: {
  visible: boolean;
  setCompanyInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [activeTab, setActiveTab] = useState<string>('Continental/Imperial');

  return (
    <Modal
      visible={visible}
      onClose={() => setCompanyInfoVisible(false)}
    >
      <div className={styles.header}>
        <div>
          <h2>公司股票信息</h2>
          <p className={styles.subTitle}>
            查看股票价格和奖励信息
          </p>
        </div>
        <button aria-label="Close modal" onClick={() => setCompanyInfoVisible(false)} className={styles.closeBtn}>
          <X size={22} />
        </button>
      </div>

      <div className={styles.content}>
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
      </div>
    </Modal>
  );
};

export default CompanyStockInfoModal;
