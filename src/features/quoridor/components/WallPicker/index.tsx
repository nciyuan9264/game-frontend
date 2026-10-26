import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ActionButton } from '@/components/GameUI/ActionButton';
import { Board } from '../Board';
import { Dialog } from '../Dialog';
import { Pawn } from '../Artwork';
import { coordinate, wallLabel, wallReasonCopy } from '../../model/board';
import { wallOptionAt } from '../../model/selectors';
import type { GameSnapshot } from '../../model/session';
import type { WallSpec } from '../../model/types';

export function WallPicker({
  data,
  initial,
  onClose,
  onUse,
}: {
  data: GameSnapshot;
  initial: WallSpec;
  onClose: () => void;
  onUse: (wall: WallSpec) => void;
}) {
  const [wall, setWall] = useState<WallSpec>({ ...initial });
  const option = wallOptionAt(data.roomData.wallOptions, wall);
  const legal = option?.legal === true;
  const side = data.roomData.currentSide || 'south';

  return <Dialog
    className="phone-slot-dialog"
    title="把这道墙，放准一点。"
    eyebrow="A PRECISE PLACE TO PAUSE"
    onClose={onClose}
    footer={<>
      <ActionButton onClick={onClose}>取消</ActionButton>
      <ActionButton
        variant="primary"
        disabled={!legal}
        onClick={() => onUse(wall)}
      >返回棋盘预览<ArrowRight size={16} /></ActionButton>
    </>}
  >
    <div
      className="phone-slot-picker"
      data-testid="wall-slot-picker"
      data-coordinate={coordinate(wall)}
      data-orientation={wall.orientation}
    >
      <div className="phone-slot-preview">
        <Board
          pawns={data.roomData.pawns}
          walls={data.roomData.walls}
          currentSide={side}
          wallOptions={data.roomData.wallOptions}
          selected={{ kind: 'wall', wall }}
          showMoves={false}
        />
        <div>
          <span className="phone-readonly">候选墙槽</span>
          <strong>{coordinate(wall)}</strong>
          <span>{wall.orientation === 'h' ? '横向' : '纵向'} · 跨两格</span>
          <small><Pawn side={side} />南北对弈<br />
            余墙 {data.roomData.wallStock[side]} 道</small>
        </div>
      </div>
      <div
        className={`phone-slot-status ${legal ? 'valid' : 'invalid'}`}
        role="status"
        data-testid="wall-slot-status"
      >
        {legal ? <ShieldCheck size={17} /> : <Info size={17} />}
        <span>{legal
          ? `${wallLabel(wall)} · 双方仍有通路`
          : wallReasonCopy(option?.reasonCode)}</span>
      </div>
      <div className="phone-slot-field">
        <span>选择列<small>A-H · 墙的左上锚点</small></span>
        <div className="phone-slot-options" role="group" aria-label="墙槽列">
          {'ABCDEFGH'.split('').map((letter, column) =>
            <button
              type="button"
              key={letter}
              aria-label={`选择第 ${letter} 列`}
              aria-pressed={wall.column === column}
              onClick={() => setWall(current => ({ ...current, column }))}
            >{letter}</button>)}
        </div>
      </div>
      <div className="phone-slot-field">
        <span>选择行<small>1-8 · 棋格之间的墙槽</small></span>
        <div className="phone-slot-options" role="group" aria-label="墙槽行">
          {Array.from({ length: 8 }, (_, row) =>
            <button
              type="button"
              key={row}
              aria-label={`选择第 ${row + 1} 行`}
              aria-pressed={wall.row === row}
              onClick={() => setWall(current => ({ ...current, row }))}
            >{row + 1}</button>)}
        </div>
      </div>
      <div className="phone-slot-direction" role="group" aria-label="墙的方向">
        <button
          type="button"
          aria-label="精确选位横向围墙"
          aria-pressed={wall.orientation === 'h'}
          onClick={() => setWall(current => ({ ...current, orientation: 'h' }))}
        ><i className="slot-wall-horizontal" />横向
          {wall.orientation === 'h' && <Check size={14} />}</button>
        <button
          type="button"
          aria-label="精确选位纵向围墙"
          aria-pressed={wall.orientation === 'v'}
          onClick={() => setWall(current => ({ ...current, orientation: 'v' }))}
        ><i className="slot-wall-vertical" />纵向
          {wall.orientation === 'v' && <Check size={14} />}</button>
      </div>
      <p className="phone-slot-note">
        这里只选位置，不会消耗围墙。<br />
        返回棋盘后，仍需确认放墙。
      </p>
    </div>
  </Dialog>;
}
