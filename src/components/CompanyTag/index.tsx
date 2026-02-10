import { Tag } from 'antd';
import { CompanyColor } from '@/const/color';
import {
  AmericanIcon, ContinentalIcon, FestivalIcon, ImperialIcon,
  SacksonIcon, TowerIcon, WorldwideIcon
} from './icons';

import styles from './index.module.less';


const companyIcons: Record<string, JSX.Element> = {
  American: <AmericanIcon />,
  Continental: <ContinentalIcon />,
  Festival: <FestivalIcon />,
  Imperial: <ImperialIcon />,
  Sackson: <SacksonIcon />,
  Tower: <TowerIcon />,
  Worldwide: <WorldwideIcon />,
};

export const CompanyTag = ({ company }: { company: keyof typeof CompanyColor }) => (
  <Tag
    className={styles.companyTag}
    color={CompanyColor[company]}
  >
    {companyIcons[company]} {company}
  </Tag>
);
