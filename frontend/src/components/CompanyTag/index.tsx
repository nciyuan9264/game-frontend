import { Tag } from 'antd';
import { CompanyColor } from '@/const/color';
import {
  AmericanIcon, ContinentalIcon, FestivalIcon, ImperialIcon,
  SacksonIcon, TowerIcon, WorldwideIcon
} from './icons';

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
    color={CompanyColor[company]}
    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, borderRadius: 8, padding: '2px 8px' }}
  >
    {companyIcons[company]} {company}
  </Tag>
);
