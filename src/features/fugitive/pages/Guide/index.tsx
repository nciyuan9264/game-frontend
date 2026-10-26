import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Footprints,
  Layers,
  Plane,
  Plus,
  Shield,
} from 'lucide-react';
import { getProfile } from '@/features/game-core/api/auth';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { AppShell } from '../../components/AppShell';
import {
  CardFace,
  Eyebrow,
  Scene,
  SourceLinks,
} from '../../components/Visual';
import { card } from '../../model/deck';

const chapters = [
  '两种身份',
  '暗置与冲刺',
  '推理与搜查',
  '逃脱与追缉',
];

export default function Guide() {
  const navigate = useNavigate();
  const profile = useAsyncResource(getProfile);
  const [step, setStep] = useState(0);

  return <AppShell title="玩法指南" profile={profile.data} compactMobileFooter>
    <main className="page-content guide-page">
      <div className="page-heading"><Eyebrow>THE ART OF DISAPPEARING</Eyebrow>
        <h1>读懂规则，藏好下一步。</h1><p>一副号码牌，两套完全不同的思路。</p>
      </div>
      <nav className="guide-tabs" aria-label="规则章节">
        {chapters.map((chapter, index) => <button type="button" key={chapter}
          aria-label={`学习${chapter}`} aria-pressed={step === index}
          className={step === index ? 'active' : ''}
          onClick={() => setStep(index)}><small>0{index + 1}</small>{chapter}</button>)}
      </nav>
      <div className="guide-layout">
        <section className={`guide-visual guide-${step}`}>
          <Scene index={[0, 2, 3, 5][step]} />
          <span className="guide-chapter">CHAPTER 0{step + 1}</span>
          {step === 0
            ? <div className="guide-two-roles"><div><Footprints size={35} />
              <b>逃到 42</b><small>FUGITIVE</small></div><span>VS.</span>
              <div><Shield size={35} /><b>找出全部</b><small>MARSHAL</small></div></div>
            : step === 1
              ? <div className="guide-card-example"><CardFace card={card(15)} />
                <ArrowRight size={25} /><CardFace card={card(20)} />
                <div className="guide-calculation">基础 3 <Plus size={14} />
                  12 号冲刺 +2 <span>＝ 前进 5 步</span></div></div>
              : step === 2
                ? <div className="guide-search-example"><div><span>猜 07 + 10</span>
                  <Check size={25} /><small>全对，一起公开</small></div>
                  <div><span>猜 07 + 11</span><span>×</span>
                    <small>有错，全部不揭晓</small></div></div>
                : <div className="guide-escape-example"><Plane size={45} />
                  <b>42</b><span>THE WAY OUT</span></div>}
          <footer><span>FUGITIVE / FIELD GUIDE</span><span>0{step + 1} / 04</span></footer>
        </section>
        <section className="guide-copy">
          <Eyebrow>{[
            'TWO SIDES OF THE SAME NIGHT',
            'KEEP THEM GUESSING',
            'TRUST THE EVIDENCE',
            'THE LAST CHANCE',
          ][step]}</Eyebrow>
          <h2>{[
            '一个制造谜题，一个解开它。',
            '用更少的线索，走更远的路。',
            '猜的不是位置，是号码。',
            '越接近自由，越要小心。',
          ][step]}</h2>
          {step === 0 ? <>
            <p>逃亡者将地点牌从小到大暗置，设法从 <b>0 到达 42</b>。追捕者要猜出所有暗置地点；只猜到最新一处还不够。</p>
            <p>牌堆分为 <b>4–14、15–28、29–41</b>。逃亡者开局拿 1、2、3、42，再从前两堆分别抽 3 张、2 张。追捕者没有起始手牌。</p>
            <div className="guide-note"><b>先手有一点不同</b>
              <p>逃亡者首回合不抽牌，放置 1 或 2 处藏身点；追捕者首回合抽 2 张后搜查。</p></div>
          </> : step === 1 ? <>
            <p>通常先抽 1 张，再选择比上一地点更大的牌。基础最多前进 <b>3</b>，冲刺牌按脚印相加：<b>1–41 中奇数 +1，偶数 +2</b>；42 不可用于冲刺。</p>
            <p>冲刺牌压在新地点下面，张数公开，数值保密。可以超额冲刺虚张声势，也可以不放新地点。</p>
            <div className="guide-note"><b>二版：潜伏也有收获</b>
              <p>如果本回合不放置新藏身点，可从最低号码的非空牌堆额外抽 1 张。</p></div>
          </> : step === 2 ? <>
            <p>抽到的牌不可能是逃亡者的藏身点，可用于排除。猜对一处，便公开该地点和下面的所有冲刺牌。</p>
            <p>你可以一次猜 <b>一个或多个号码</b>。多个号码必须全部正确才翻牌；任意一个错误，就全部不翻。</p>
            <div className="guide-note"><b>一次失败，不代表永久排除</b>
              <p>某号码目前未命中，未来仍可能成为新地点。手册区分确定已知与个人推测。</p></div>
          </> : <>
            <p>所有已放置藏身点被揭晓，追捕者立即获胜。逃亡者合法打出 <b>42</b> 后，通常逃脱。</p>
            <p>如果此时最高的已公开地点是 <b>29 或更低</b>，追捕者可发动最终追缉：不再抽牌，每次猜一个。</p>
            <div className="guide-note"><b>最后一次机会</b>
              <p>最终追缉中，一次猜错就让逃亡者获胜；连续猜出全部剩余地点则抓获。</p></div>
          </>}
          <div className="guide-buttons">
            <button className="text-button" type="button" disabled={!step}
              onClick={() => setStep(value => value - 1)}><ArrowLeft size={15} />上一步</button>
            <span className="guide-step-count">{step + 1} / 4</span>
            <button className="button primary" type="button"
              onClick={() => step === 3
                ? navigate('/game/fugitive')
                : setStep(value => value + 1)}>
              {step === 3 ? '进入大厅' : '下一步'}<ArrowRight size={16} /></button>
          </div>
        </section>
      </div>
      <button className="button secondary guide-library-link" type="button"
        onClick={() => navigate('/game/fugitive/cards')}>
        <Layers size={15} />查看完整牌库<ArrowUpRight size={14} /></button>
      <SourceLinks />
      <p className="prototype-disclaimer">正式对局采用二版基础规则，不含 Shift；洗牌、手牌、暗置路线与判胜均由服务端处理。</p>
    </main>
  </AppShell>;
}
