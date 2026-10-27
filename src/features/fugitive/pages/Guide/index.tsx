import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Footprints,
  Layers,
  Plus,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { GameTabs } from '@/components/GameUI/GameTabs';
import { getProfile } from '@/features/game-core/api/auth';
import { useGuideSteps } from '@/features/game-core/hooks/useGuideSteps';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell } from '../../components/AppShell';
import { Scene } from '../../components/Visual';
import styles from '../community.module.less';

const guideSteps: ReadonlyArray<{
  tab: string;
  eyebrow: string;
  title: string;
  text: ReactNode;
  points: readonly ReactNode[];
  hintTitle: string;
  hint: ReactNode;
}> = [
  {
    tab: '身份',
    eyebrow: 'TWO SIDES OF THE SAME NIGHT',
    title: '一个制造谜题，一个解开它。',
    text: <>逃亡者将地点牌从小到大暗置，设法从 <b>0 到达 42</b>；追捕者要找出全部暗置地点。</>,
    points: [
      <>逃亡者开局持有 1、2、3、42，并从前两叠牌各补充手牌。</>,
      <>追捕者没有起始手牌，只能通过抽牌和已公开信息排除号码。</>,
      <>只猜到最新一处还不够，全部藏身点都公开后才能完成抓捕。</>,
    ],
    hintTitle: '先手有一点不同',
    hint: <>逃亡者不抽牌，放置 1–2 处藏身点；追捕者抽 2 张后搜查。</>,
  },
  {
    tab: '暗置',
    eyebrow: 'KEEP THEM GUESSING',
    title: '用更少的线索，走更远的路。',
    text: <>通常先抽 1 张，再暗置一个更大的地点。基础移动距离为 <b>3</b>，冲刺牌可以增加范围。</>,
    points: [
      <>1–41 中的奇数牌提供 1 点冲刺，偶数牌提供 2 点冲刺。</>,
      <>冲刺牌压在新地点下方：张数公开，号码保密，也可以超额冲刺。</>,
      <>42 只能作为终点，不能当作冲刺牌使用。</>,
    ],
    hintTitle: '潜伏也有收获',
    hint: <>本回合不放置新藏身点时，可从最低号码的非空牌堆额外抽 1 张。</>,
  },
  {
    tab: '搜查',
    eyebrow: 'TRUST THE EVIDENCE',
    title: '猜的不是位置，是号码。',
    text: <>抽到的牌不可能是逃亡者的藏身点。追捕者可以据此排除号码，并一次猜测一个或多个地点。</>,
    points: [
      <>猜对一处，就公开该地点及其下方的全部冲刺牌。</>,
      <>一次猜多个号码时，必须全部正确才会一起翻开。</>,
      <>任意一个号码错误，本次猜测中的所有牌都保持暗置。</>,
    ],
    hintTitle: '失败不等于永久排除',
    hint: <>某个号码本回合没有命中，之后仍可能被逃亡者放成新的藏身点。</>,
  },
  {
    tab: '追缉',
    eyebrow: 'THE LAST CHANCE',
    title: '越接近自由，越要小心。',
    text: <>所有藏身点被揭晓时追捕者获胜；逃亡者合法打出 <b>42</b> 后，通常立即逃脱。</>,
    points: [
      <>最高公开地点高于 29 时，逃亡者抵达 42 后直接获胜。</>,
      <>最高公开地点不超过 29 时，追捕者进入最终追缉。</>,
      <>最终追缉不再抽牌，每次只能猜一个剩余地点。</>,
    ],
    hintTitle: '最后一次机会',
    hint: <>最终追缉中，一次猜错就让逃亡者获胜；连续猜出全部剩余地点则完成抓捕。</>,
  },
];

function GuideVisual({ step }: { step: number }) {
  return <section className={styles.guideVisual} aria-label={`玩法图示：${guideSteps[step].tab}`}>
    <Scene index={[0, 2, 3, 5][step]} className={styles.visualScene} />
    <span className={styles.guideChapter}>CHAPTER 0{step + 1}</span>
    {step === 0
      ? <div className={styles.twoRoles}><div><Footprints size={31} />
          <b>逃到 42</b><small>FUGITIVE</small></div><span>VS.</span>
          <div><Shield size={31} /><b>找出全部</b><small>MARSHAL</small></div></div>
      : step === 1
        ? <div className={styles.routeExample}><b>15</b><ArrowRight size={23} />
          <b>20</b><small><Plus size={12} />2 点冲刺</small></div>
        : step === 2
          ? <div className={styles.searchExample}><span>07 + 10<small>全部正确</small></span>
            <span>07 + 11<small>有错，不公开</small></span></div>
          : <div className={styles.escapeExample}><Footprints size={27} />
            <b>42</b><span>THE WAY OUT</span></div>}
  </section>;
}

export default function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const guide = useGuideSteps(guideSteps);
  const step = guide.current;
  const handlePrimaryAction = () => {
    if (guide.isLast) {
      navigate('/game/fugitive');
      return;
    }
    guide.next();
  };

  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
    <main className={`page-content guide-page ${styles.page} ${styles.guidePage}`}>
      <header className={styles.guideHeading}><small>LEARN THE ESCAPE ROUTE</small>
        <h1>读懂规则，藏好下一步。</h1></header>
      <div className={styles.guideLayout} data-testid="fugitive-guide-layout">
        <aside className={styles.guideAside} data-testid="fugitive-guide-summary">
          <GuideVisual step={guide.index} />
          <div className={styles.guideFacts}>
            <span><Users size={18} />2 人</span>
            <span><Clock size={18} />15–30 分钟</span>
            <span><Layers size={18} />43 张地点牌</span>
          </div>
        </aside>
        <section className={styles.guidePanel} data-testid="fugitive-guide-panel">
          <GameTabs className={styles.guideTabs} activeClassName={styles.activeTab}
            ariaLabel="玩法章节" value={guide.index} onChange={guide.select}
            items={guideSteps.map((item, index) => ({
              value: index,
              label: `${String(index + 1).padStart(2, '0')} ${item.tab}`,
            }))} />
          <small className={styles.guideEyebrow}>{step.eyebrow}</small>
          <h2>{step.title}</h2>
          <p>{step.text}</p>
          <ol>{step.points.map((point, index) => <li key={index}>{point}</li>)}</ol>
          <div className={styles.guideHint}><ShieldCheck size={16} />
            <span><b>{step.hintTitle}</b>{step.hint}</span></div>
          <div className={styles.guideActions}>
            <button className="button primary" type="button"
              onClick={handlePrimaryAction}>
              {guide.isLast ? '进入大厅' : '下一步'}<ArrowRight size={16} />
            </button>
            <button className="button secondary" type="button"
              onClick={() => navigate('/game/fugitive/cards')}>
              <Layers size={15} />牌库速查
            </button>
          </div>
        </section>
      </div>
    </main>
  </AppShell>;
}
