import type { ReactNode } from 'react';
import type { Company } from '../../model/types';

const glyphs: Record<Company, ReactNode> = {
  American: <path d="M8 35h32M12 34V16h24v18M18 16V9h12v7M22 9V4h4v5M17 21h3m8 0h3m-14 6h3m8 0h3M23 35V21h2v14" />,
  Continental: <path d="M8 35h32M12 34V16l12-7 12 7v18M9 16h30M18 21v10m6-10v10m6-10v10M18 5h12M24 5v4" />,
  Festival: <path d="m7 34 7-19 10 8 10-8 7 19H7Zm7-19V8m20 7V8M14 8l7 4-7 3m20-7 7 4-7 3M19 34v-6h10v6" />,
  Imperial: <><path d="m8 14 9 7 7-12 7 12 9-7-5 17H13L8 14ZM13 35h22M15 39h18" /><circle cx="8" cy="12" r="2" /><circle cx="24" cy="7" r="2" /><circle cx="40" cy="12" r="2" /></>,
  Sackson: <><path d="m7 35 17-26 17 26H7Z" /><path d="m16 35 8-15 8 15M11 29h26M19 23h10M24 9V4" /></>,
  Tower: <><path d="M11 34V17h6v-7h6V5h2v5h6v7h6v17H11Zm9 0V22h8v12M8 37h32" /><path d="M16 21v3m0 4v3m16-10v3m0 4v3M21 14h6" /></>,
  Worldwide: <><circle cx="24" cy="21" r="14" /><ellipse cx="24" cy="21" rx="7" ry="14" /><path d="M11 16h26M11 26h26M24 7v28M14 39h20M24 35v4" /></>,
};

export function CompanyGlyph({ company, size = 30 }: { company: Company; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 44" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{glyphs[company]}</svg>;
}
