import React from 'react';
import { CompanyKey, WsRoomSyncData } from '@/types/room';
import styles from './index.module.less';
import { backendName2FrontendName } from '@/util/user';
import { CompanyColor } from '@/const/color';

interface SettlementProps {
  data?: WsRoomSyncData;
}

const Settlement: React.FC<SettlementProps> = ({
  data,
}) => {
  const mainCompany = data?.tempData?.merge_main_company_temp;
  const mainCompanyStockPrice = data?.roomData.companyInfo?.[mainCompany as CompanyKey]?.stockPrice;

  return (
    <div className={styles.settlementContainer}>
      <div className={styles.sectionTitle}>
        破产清算：被
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 600,
          margin: '0 .2rem',
          color: CompanyColor[mainCompany as CompanyKey],
        }}>
          {mainCompany}(${mainCompanyStockPrice})
        </span>
        合并的公司：
      </div>
      <div className={styles.companyList}>
        {
          Object.entries(data?.tempData?.mergeSettleData ?? {}).map(([company, value]) => {
            const companyName = company as CompanyKey;
            const dividends = value.dividends;
            return (
              <div key={company} className={styles.companyCard} style={{ borderLeft: `4px solid ${CompanyColor[companyName]}` }}>
                <div className={styles.companyHeader}>
                  {/* <div
                    className={styles.logo}
                    style={{ backgroundColor: CompanyColor[companyName] }}
                  >
                    {companyName.slice(0, 2).toUpperCase()}
                  </div> */}
                  <div
                    className={styles.companyName}
                    style={{ color: CompanyColor[companyName] }}
                  >
                    {companyName}
                  </div>
                </div>
                {
                  Object.entries(dividends)
                    .sort(([, a], [, b]) => Number(b) - Number(a))
                    .map(([key, value]) => (
                      <div key={key} className={styles.dividendRow}>
                        <div className={styles.name}>{backendName2FrontendName(key)} 获得现金：</div>
                        <div className={styles.amount}>${value}</div>
                      </div>
                    ))
                }
              </div>
            )
          })
        }
      </div>
    </div>
  );
};

export default Settlement;
