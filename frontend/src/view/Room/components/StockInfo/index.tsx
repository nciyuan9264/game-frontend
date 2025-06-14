import { Modal, Tabs, Table } from 'antd';
import React from 'react';

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
    { range: [21, 30], price: 1000, majorityBonus: 10000, minorityBonus: 5000 },
    { range: [31, 40], price: 1100, majorityBonus: 11000, minorityBonus: 5500 },
    { range: [41, 1000], price: 1200, majorityBonus: 12000, minorityBonus: 6000 },
  ],
  'American/Festival/Worldwide': [
    { range: [2, 2], price: 300, majorityBonus: 3000, minorityBonus: 1500 },
    { range: [3, 3], price: 400, majorityBonus: 4000, minorityBonus: 2000 },
    { range: [4, 4], price: 500, majorityBonus: 5000, minorityBonus: 2500 },
    { range: [5, 5], price: 600, majorityBonus: 6000, minorityBonus: 3000 },
    { range: [6, 10], price: 700, majorityBonus: 7000, minorityBonus: 3500 },
    { range: [11, 20], price: 800, majorityBonus: 8000, minorityBonus: 4000 },
    { range: [21, 30], price: 900, majorityBonus: 9000, minorityBonus: 4500 },
    { range: [31, 40], price: 1000, majorityBonus: 10000, minorityBonus: 5000 },
    { range: [41, 1000], price: 1100, majorityBonus: 11000, minorityBonus: 5500 },
  ],
  'Tower/Sackson': [
    { range: [2, 2], price: 200, majorityBonus: 2000, minorityBonus: 1000 },
    { range: [3, 3], price: 300, majorityBonus: 3000, minorityBonus: 1500 },
    { range: [4, 4], price: 400, majorityBonus: 4000, minorityBonus: 2000 },
    { range: [5, 5], price: 500, majorityBonus: 5000, minorityBonus: 2500 },
    { range: [6, 10], price: 600, majorityBonus: 6000, minorityBonus: 3000 },
    { range: [11, 20], price: 700, majorityBonus: 7000, minorityBonus: 3500 },
    { range: [21, 30], price: 800, majorityBonus: 8000, minorityBonus: 4000 },
    { range: [31, 40], price: 900, majorityBonus: 9000, minorityBonus: 4500 },
    { range: [41, 1000], price: 1000, majorityBonus: 10000, minorityBonus: 5000 },
  ],
};

const columns = [
  {
    title: '地块数量区间',
    dataIndex: 'range',
    key: 'range',
    render: (range: [number, number]) => `${range[0]} - ${range[1]}`,
  },
  {
    title: '股票价格',
    dataIndex: 'price',
    key: 'price',
  },
  {
    title: '大股东奖励',
    dataIndex: 'majorityBonus',
    key: 'majorityBonus',
  },
  {
    title: '二股东奖励',
    dataIndex: 'minorityBonus',
    key: 'minorityBonus',
  },
];

const CompanyStockInfoModal = ({
  visible,
  setCompanyInfoVisible,
}: {
  visible: boolean;
  setCompanyInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Modal
      title="公司股票信息表"
      open={visible}
      closable={true}
      onCancel={() => setCompanyInfoVisible(false)}
      footer={null}
      centered
      maskClosable={true}
      width={800}
    >
      <Tabs
        defaultActiveKey="Continental"
        items={Object.entries(stockData).map(([companyName, stockList]) => ({
          key: companyName,
          label: companyName,
          children: (
            <Table
              size="small"
              pagination={false}
              rowKey={(_, index) => `${companyName}-${index}`}
              columns={columns}
              dataSource={stockList}
            />
          ),
        }))}
      />
    </Modal>
  );
};

export default CompanyStockInfoModal;
