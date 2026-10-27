import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameSnapshot } from '../model/session';
import { useOnitamaPlayUI } from './useOnitamaPlayUI';

function snapshot(seq: number): GameSnapshot {
  return {
    schemaVersion: 2,
    type: 'ROOM_SYNC',
    roomID: 'room',
    matchID: 'match',
    seq,
    phaseVersion: seq,
    turnNumber: seq,
    ownerID: 'blue-player',
    visibility: 'private',
    playerId: 'blue-player',
    playerData: {},
    roomData: {
      pieces: [],
      hands: {
        blue: ['tiger', 'crane'],
        red: ['dragon', 'elephant'],
      },
      transitCardID: 'crab',
      currentPlayer: 'blue-player',
      currentSide: 'blue',
      bluePlayerID: 'blue-player',
      redPlayerID: 'red-player',
      firstPlayerID: 'blue-player',
      roundNo: 1,
      gameStatus: 'playing',
      legalMoves: [{
        cardID: 'tiger',
        pieceID: 'blue-master',
        to: { row: 2, column: 2 },
        winning: false,
      }],
      canPass: false,
      moveLog: [],
      players: {},
      playerOrder: ['blue-player', 'red-player'],
    },
  };
}

describe('useOnitamaPlayUI', () => {
  it('supports either selection order and clears stale drafts by snapshot key', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useOnitamaPlayUI(data),
      { initialProps: { data: snapshot(4) } },
    );

    act(() => {
      result.current.selectPiece('blue-master');
      result.current.selectCard('tiger');
      result.current.selectTarget({ row: 2, column: 2 });
    });
    expect(result.current.pendingMove).toMatchObject({
      cardID: 'tiger',
      pieceID: 'blue-master',
      to: { row: 2, column: 2 },
    });

    rerender({ data: snapshot(5) });
    expect(result.current.selectedCard).toBeUndefined();
    expect(result.current.selectedPiece).toBeUndefined();
    expect(result.current.pendingTarget).toBeUndefined();
  });
});
