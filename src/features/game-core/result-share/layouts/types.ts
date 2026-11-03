import type { ResultCardModel } from '../model';
import type { ResultStandingsDensity } from '../ResultStandings';
import type { ResultCardTheme } from '../themes';

export interface ResultCardLayoutProps {
  model: ResultCardModel;
  design: ResultCardTheme;
  density: ResultStandingsDensity;
}
