export type Side = 0 | 1;
export type UnitId = 'sword' | 'pike' | 'crossbow' | 'light' | 'archer' | 'cavalry' | 'lancer' | 'scout' | 'berserker' | 'ensign' | 'footman' | 'knight' | 'marshall' | 'mercenary' | 'guard' | 'priest' | 'royal';
export type Action = 'deploy' | 'bolster' | 'move' | 'attack' | 'control' | 'tactic' | 'recruit' | 'initiative' | 'pass' | 'finish' | 'defend';
export type Scenario = 'fresh' | 'midgame' | 'endgame' | 'drill';
export type UnitInfo = { id: UnitId; name: string; en: string; role: string; total: number; art: number; ability: string; kind: string; restriction?: string; tip: string; };
export const UNITS: Record<UnitId, UnitInfo> = {
  sword: { id:'sword', name:'剑士', en:'SWORDSMAN', role:'近战 · 推进', total:5, art:0, kind:'特性 · 乘胜推进', ability:'剑士攻击后，可以立即移动一格。', tip:'先瓦解防线，再借势占据更有利的位置。' },
  pike: { id:'pike', name:'长枪兵', en:'PIKEMAN', role:'近战 · 反制', total:4, art:1, kind:'特性 · 枪阵反击', ability:'被相邻单位攻击时，同时移除攻击者的一枚兵种币。', tip:'即使最后一枚币被移除，反击仍然生效。' },
  crossbow: { id:'crossbow', name:'弩兵', en:'CROSSBOWMAN', role:'远程 · 直线射击', total:5, art:2, kind:'战术 · 穿线射击', ability:'攻击直线上恰好两格外的敌军，中间不能有单位。', tip:'也可以用普通攻击对付相邻敌军。' },
  light: { id:'light', name:'轻骑兵', en:'LIGHT CAVALRY', role:'机动 · 快速转移', total:5, art:3, kind:'战术 · 疾行', ability:'连续移动两格，沿途必须为空格。', tip:'只想移动一格时，使用普通移动。到达据点后仍需另花一枚币控制。' },
  archer: { id:'archer', name:'弓箭手', en:'ARCHER', role:'远程 · 越障打击', total:4, art:4, kind:'战术 · 抛射', ability:'攻击恰好两格外的敌军，可以越过中间的单位。', restriction:'不能普通攻击，也不能攻击相邻单位。', tip:'距离比直线更重要，保持两格的安全区。' },
  cavalry: { id:'cavalry', name:'骑兵', en:'CAVALRY', role:'突击 · 机动作战', total:4, art:5, kind:'战术 · 突袭', ability:'移动一格，然后攻击相邻敌军。', tip:'一次战术使用一枚币，移动与攻击连续完成。' },
  lancer: { id:'lancer', name:'枪骑兵', en:'LANCER', role:'突击 · 直线冲锋', total:4, art:6, kind:'战术 · 冲锋', ability:'沿直线移动一或两格，随后继续沿该直线攻击。', restriction:'只能通过战术攻击，冲锋必须有合法攻击目标。', tip:'把移动路线和攻击目标一起预览，再确认冲锋。' },
  scout: { id:'scout', name:'侦察兵', en:'SCOUT', role:'部署 · 战线延伸', total:5, art:7, kind:'特性 · 前线部署', ability:'也可以部署到任意友方单位相邻的空格。', tip:'不必局限于已控制的据点，但仍只能有一支侦察兵。' },
  berserker: { id:'berserker', name:'狂战士', en:'BERSERKER', role:'近战 · 连续调遣', total:5, art:8, kind:'特性 · 不息攻势', ability:'调遣后，可从本单位弃置一枚增援币，再调遣一次；可连续使用，但必须保留最后一枚。', tip:'增援币进入正面弃置区，不是永久损失。旗手或元帅授予的调遣同样可以触发。' },
  ensign: { id:'ensign', name:'旗手', en:'ENSIGN', role:'支援 · 战线调动', total:5, art:9, kind:'战术 · 旗语调动', ability:'选择两格内的一支友军，令其普通移动一格，落点仍须在旗手两格内。', tip:'不是传送。不能替友军执行两格疾行或其他战术；移动后仍可触发其特性。' },
  footman: { id:'footman', name:'步兵', en:'FOOTMAN', role:'近战 · 双线协同', total:5, art:10, kind:'战术 · 双线调遣', ability:'最多同时部署两支步兵。弃置一枚步兵币，依次让每支步兵各调遣一次。', tip:'先选择一支步兵及其行动，再指挥另一支；可分别移动、攻击或控制，不可让同一支行动两次。' },
  knight: { id:'knight', name:'骑士', en:'KNIGHT', role:'近战 · 重甲防线', total:4, art:11, kind:'特性 · 重甲', ability:'只有已增援的敌军（至少两枚叠币）才能攻击骑士。', tip:'限制同样适用于远程、冲锋和元帅授予的攻击。长枪兵的反击不是攻击，仍可造成损失。' },
  marshall: { id:'marshall', name:'元帅', en:'MARSHALL', role:'支援 · 协同攻击', total:5, art:12, kind:'战术 · 协同打击', ability:'选择两格内的一支友军，让其进行一次合法的普通攻击。', restriction:'不能授予战术攻击，因此不能指挥弓箭手或枪骑兵攻击。', tip:'剑士推进、狂战士续行和战斗牧师追加指令仍会触发。' },
  mercenary: { id:'mercenary', name:'雇佣兵', en:'MERCENARY', role:'近战 · 招募联动', total:5, art:13, kind:'特性 · 应募出击', ability:'招募一枚雇佣兵币后，可让已部署的雇佣兵立即调遣一次。', restriction:'不能用这次额外调遣部署、增援或再次招募。', tip:'用任意手牌支付招募即可。新招募币仍进入弃置区，不是用新币立即出战。' },
  guard: { id:'guard', name:'皇家卫队', en:'ROYAL GUARD', role:'防御 · 王室机动', total:5, art:14, kind:'战术 · 王室驰援', ability:'弃置王室币，让已部署的皇家卫队移动至两步内的己方空据点；途中不得有单位。', restriction:'受攻击时，可选择从补给区永久移除一枚皇家卫队币，代替棋盘损失。', tip:'采用发行方认可的修订卡面。王室币与皇家卫队兵种币不同；补给抵挡是可选的防御决定。' },
  priest: { id:'priest', name:'战斗牧师', en:'WARRIOR PRIEST', role:'支援 · 追加指令', total:4, art:15, kind:'特性 · 战意鼓舞', ability:'攻击或控制后，立即从军袋抽一枚币，并立刻使用它执行任意一种合法行动。', tip:'追加币不能留到以后，也不能换用原手牌；空袋先混洗弃置区，完成追加指令后才轮到对手。' },
  royal: { id:'royal', name:'王室币', en:'ROYAL COIN', role:'调度 · 王室指令', total:1, art:-1, kind:'王室指令 · 非兵种', ability:'可背面支付招募、争夺先手或跳过；己方皇家卫队已部署时，还可支付其王室驰援战术。', restriction:'王室币不是第十七种兵种，不能部署或用于增援。', tip:'兵种池有 16 种；每方仍各带一枚王室币。' },
};
export const ROSTERS: UnitId[][] = [['sword','pike','crossbow','light'], ['archer','cavalry','lancer','scout']];
export const UNIT_IDS = Object.keys(UNITS).filter(t=>t!=='royal') as UnitId[];
export const NEW_UNITS: UnitId[] = ['berserker','ensign','footman','knight','marshall','mercenary','guard','priest'];
export const ACTION_NAMES: Record<Action,string> = {deploy:'部署',bolster:'增援',move:'移动',attack:'攻击',control:'控制',tactic:'战术',recruit:'招募',initiative:'争夺先手',pass:'跳过',finish:'结束追加调遣',defend:'防护选择'};
export type Cell = {q:number;r:number;key:string;label:string};
export const keyOf = (q:number,r:number) => `${q},${r}`;
export const CELLS: Cell[] = [];
for(let q=-3;q<=3;q++) { const lo=Math.max(-3,-q-3); for(let r=lo;r<=Math.min(3,-q+3);r++) CELLS.push({q,r,key:keyOf(q,r),label:`${String.fromCharCode(68+q)}${r-lo+1}`}); }
export const CELL_MAP = Object.fromEntries(CELLS.map(c=>[c.key,c]));
export const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const LOCATIONS = ['-1,-2','2,-3','-2,3','1,2','-2,0','1,-1','3,-2','-3,2','-1,1','2,0'];
export const STARTS = [['-2,3','1,2'],['-1,-2','2,-3']];
export function adjacent(k:string) { const c=CELL_MAP[k]; return c?DIRS.map(([q,r])=>keyOf(c.q+q,c.r+r)).filter(k=>CELL_MAP[k]):[]; }
export function distance(a:string,b:string) { const x=CELL_MAP[a],y=CELL_MAP[b]; return (Math.abs(x.q-y.q)+Math.abs(x.r-y.r)+Math.abs(x.q+x.r-y.q-y.r))/2; }
export const cellLabel=(key:string)=>CELL_MAP[key]?.label||key;
export type Piece = {
  id: string;
  cell: string;
  type: UnitId;
  side: Side;
  n: number;
};
export type CoinData = {
  id: string;
  type?: UnitId;
  faceUp: boolean;
};
export type Discard = CoinData;
export type Army = {
  playerID: string;
  name: string;
  ai: boolean;
  avatar?: string;
  bagCount: number;
  hand: CoinData[];
  handCount: number;
  discard: Discard[];
  supply: Partial<Record<UnitId, number>>;
  lost: Partial<Record<UnitId, number>>;
  roster: UnitId[];
};
export type Log = {
  id: number;
  round: number;
  side: Side | null;
  text: string;
  automatic?: boolean;
};
export type Maneuver = 'move' | 'attack' | 'control';
export type Pending = {
  kind: string;
  side: Side;
  playerID: string;
  actorUnitID?: string;
  sourceUnitID?: string;
  targetUnitID?: string;
  coinID?: string;
  unitType?: UnitId;
  remainingUnitIDs?: string[];
  description?: string;
};
export type Plan = {
  actionID: string;
  action: Action;
  side: Side;
  coinID?: string;
  type: UnitId;
  from?: string;
  to?: string;
  target?: string;
  targetUnitID?: string;
  path?: string[];
  recruit?: UnitId;
  after?: string;
  actor?: UnitId;
  actorUnitID?: string;
  source?: string;
  sourceUnitID?: string;
  order?: Maneuver;
  free?: boolean;
  defense?: 'supply' | 'unit';
};
export type Game = {
  board: Record<string, Piece>;
  controls: Record<string, Side>;
  players: Army[];
  round: number;
  turn: Side;
  initiative: Side;
  phase: 'playing' | 'pending' | 'end';
  winner: Side | null;
  log: Log[];
  actions: number;
  pending?: Pending;
  legalActions: Plan[];
  selfSide: Side;
  currentPlayerID: string;
  turnDeadline?: string;
};

export const rosterOf = (game: Game, side: Side) => game.players[side].roster;
export const pieceId = (piece: Piece) => piece.id;
export const actingType = (plan: Plan) => plan.actor || plan.type;
export const maneuverOf = (plan: Plan): Action => plan.order || plan.action;
export const freeCommand = (game: Game) =>
  !!game.pending && game.pending.kind !== 'priest';
export const score = (game: Game, side: Side) =>
  Object.values(game.controls).filter(owner => owner === side).length;
export const findUnit = (game: Game, type: UnitId, side: Side) =>
  Object.keys(game.board).find(key =>
    game.board[key].type === type && game.board[key].side === side);
export const findUnits = (game: Game, type: UnitId, side: Side) =>
  Object.keys(game.board).filter(key =>
    game.board[key].type === type && game.board[key].side === side);
export const allPlans = (game: Game, side: Side, coinID?: string) =>
  game.legalActions.filter(plan => plan.side === side && (
    coinID ? plan.coinID === coinID : !plan.coinID
  ));

export function planText(plan: Plan): string {
  const unit = UNITS[actingType(plan)];
  const name = unit?.name ?? '单位';
  const prefix = plan.free ? '追加调遣 · ' : '';
  switch (plan.action) {
    case 'deploy': return `部署${name}至 ${cellLabel(plan.to!)}`;
    case 'bolster': return `为 ${cellLabel(plan.from!)} 的${name}增援一枚兵种币`;
    case 'move': return `${prefix}${name}移动至 ${cellLabel(plan.to!)}`;
    case 'attack': return `${prefix}${name}攻击 ${cellLabel(plan.target!)}${plan.after ? `，随后移动至 ${cellLabel(plan.after)}` : ''}`;
    case 'control': return `${prefix}${name}控制 ${cellLabel(plan.to!)} 据点`;
    case 'tactic': return `${plan.source ? `${UNITS[plan.type].name}指挥 · ` : plan.type === 'royal' ? '王室驰援 · ' : ''}${name}${plan.to ? `移动至 ${cellLabel(plan.to)}` : ''}${plan.target ? `攻击 ${cellLabel(plan.target)}` : ''}`;
    case 'recruit': return `招募${UNITS[plan.recruit!].name} · 加入弃置区`;
    case 'initiative': return '争夺先手 · 从下一轮开始生效';
    case 'pass': return '背面弃置一枚币 · 跳过这次行动';
    case 'finish': return '结束追加调遣 · 保留其余指令';
    case 'defend': return plan.defense === 'supply'
      ? '从补给移除一枚皇家卫队币 · 棋盘单位不受损'
      : '承受攻击 · 从棋盘单位移除一枚皇家卫队币';
  }
}
