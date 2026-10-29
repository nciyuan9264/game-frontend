import { Building2, Clock3, Users } from 'lucide-react';
import { GameMobileLobby } from '@/components/GameUI/GamePublicMobile';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Feedback } from '@/components/GameUI/Panel';
import { CompanyGlyph } from '../../components/CompanyGlyph';
import { RoomCard } from '../../components/RoomCard';
import cityArt from '../../assets/city-art.webp';
import { companyColors, companyKeys } from '../../model/types';
import type { LobbyViewProps } from './parts';
import styles from './index.module.less';

export function LobbyMobile(props: LobbyViewProps) {
  const { lobby } = props;
  return <GameMobileLobby
    className={styles.mobileLobby}
    eyebrow="YOUR NEXT CITY STARTS HERE"
    title={<>落下一块地，<br />下一座城属于你。</>}
    description="开一张桌，邀请朋友。从第一块地开始，经营你们的城市。"
    media={<img src={cityArt} alt="暖光中的城市酒店模型" />}
    facts={[
      { icon: <Users />, value: '2–6', label: '位合伙人' },
      { icon: <Clock3 />, value: '45–90', label: '分钟' },
      { icon: <Building2 />, value: '7', label: '家公司' },
    ]}
    factsContent={<div className={styles.companies}
      data-game-mobile-lobby-facts><span>七家公司
        <small>THE HOTEL COLLECTION</small></span>
      <div>{companyKeys.map(company => <button type="button" key={company}
        style={{ color: companyColors[company] }}
        aria-label={`查看 ${company} 股价`}
        onClick={() => props.onCompany(company)}>
        <CompanyGlyph company={company} size={25} />
        <b>{company.toUpperCase()}</b>
      </button>)}</div>
    </div>}
    browserEyebrow="FIND YOUR TABLE"
    browserTitle="找到房间，一起开场。"
    roomCount={`${lobby.rooms.length} 个可见房间`}
    filters={[
      { value: 'all', label: '全部房间' },
      { value: 'joinable', label: '可加入' },
      { value: 'playing', label: '对局中' },
    ]}
    filter={lobby.filter}
    onFilterChange={lobby.setFilter}
    query={lobby.query}
    onQueryChange={lobby.setQuery}
    rooms={lobby.filteredRooms}
    renderRoom={room => <RoomCard key={room.roomID} room={room}
      userID={props.userID} onEnter={props.onEnter} />}
    onCreate={props.onCreate}
    onShare={props.onShare}
    joinCode={props.code}
    onJoinCodeChange={props.setCode}
    onJoin={props.onJoin}
    error={lobby.error && <div><Feedback error>{lobby.error}</Feedback>
      <ActionButton onClick={lobby.refresh} pending={lobby.refreshing}>重试</ActionButton>
    </div>}
  />;
}
