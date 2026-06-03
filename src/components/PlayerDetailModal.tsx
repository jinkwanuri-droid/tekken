import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Trophy, BarChart3, History, Target, Users } from 'lucide-react';
import { useTournament } from '../store';
import { MatchItem, Player, MatchSet } from '../types';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ isOpen, onClose }) => {
  const { state } = useTournament();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const allPlayers = useMemo(() => {
    return state.teams.flatMap(t => t.players);
  }, [state.teams]);

  const stats = useMemo(() => {
    if (!selectedPlayerId) return null;

    const player = allPlayers.find(p => p.id === selectedPlayerId);
    const team = state.teams.find(t => t.players.some(p => p.id === selectedPlayerId));
    if (!player || !team) return null;

    const matches: MatchItem[] = state.matches;
    const playerSets: { set: MatchSet; match: MatchItem; isTeam1: boolean }[] = [];

    // Player specific stats
    matches.forEach(m => {
      m.sets.forEach(s => {
        if (s.team1PlayerId === selectedPlayerId) {
          playerSets.push({ set: s, match: m, isTeam1: true });
        } else if (s.team2PlayerId === selectedPlayerId) {
          playerSets.push({ set: s, match: m, isTeam1: false });
        }
      });
    });

    // Team stats calculation
    const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
    const teamMatchWins = teamMatches.filter(m => m.winnerId === team.id).length;
    const teamMatchLosses = teamMatches.filter(m => m.status === 'completed' && m.winnerId && m.winnerId !== team.id).length;

    let teamSetWins = 0;
    let teamSetLosses = 0;
    teamMatches.forEach(m => {
      if (m.team1Id === team.id) {
        teamSetWins += m.team1Score;
        teamSetLosses += m.team2Score;
      } else {
        teamSetWins += m.team2Score;
        teamSetLosses += m.team1Score;
      }
    });

    // Basic Stats for Player
    const totalSets = playerSets.length;
    const setWins = playerSets.filter(ps => ps.set.winnerTeamId === (ps.isTeam1 ? ps.match.team1Id : ps.match.team2Id)).length;
    const setWinRate = totalSets > 0 ? (setWins / totalSets) * 100 : 0;

    let totalRounds = 0;
    let roundWins = 0;
    const charStats: Record<string, { wins: number; total: number }> = {};

    playerSets.forEach(ps => {
      const pRounds = ps.isTeam1 ? (ps.set.team1Rounds || 0) : (ps.set.team2Rounds || 0);
      const oRounds = ps.isTeam1 ? (ps.set.team2Rounds || 0) : (ps.set.team1Rounds || 0);
      totalRounds += (pRounds + oRounds);
      roundWins += pRounds;

      const char = ps.isTeam1 ? ps.set.team1Character : ps.set.team2Character;
      if (char) {
        if (!charStats[char]) charStats[char] = { wins: 0, total: 0 };
        charStats[char].total += 1;
        if (ps.set.winnerTeamId === (ps.isTeam1 ? ps.match.team1Id : ps.match.team2Id)) {
          charStats[char].wins += 1;
        }
      }
    });

    const roundWinRate = totalRounds > 0 ? (roundWins / totalRounds) * 100 : 0;

    const topChars = Object.entries(charStats)
      .map(([name, s]) => ({
        name,
        winRate: (s.wins / s.total) * 100,
        total: s.total,
        wins: s.wins
      }))
      .sort((a, b) => b.winRate - a.winRate || b.total - a.total)
      .slice(0, 3);

    return {
      player,
      team,
      teamMatchWins,
      teamMatchLosses,
      teamSetWins,
      teamSetLosses,
      totalSets,
      setWins,
      setWinRate,
      totalRounds,
      roundWins,
      roundWinRate,
      topChars,
      history: playerSets.sort((a, b) => b.match.id.localeCompare(a.match.id)).slice(0, 10)
    };
  }, [selectedPlayerId, state.matches, allPlayers, state.teams]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0c0f12] border border-hairline rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh]">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-surface-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">플레이어 상세 분석</h2>
          </div>
          <button onClick={onClose} className="p-2 text-ink-subtle hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Fixed Selection Area */}
        <div className="px-6 py-4 border-b border-hairline/30 bg-surface/50 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-ink-tertiary" />
            </div>
            <select
              className="w-full glass-input pl-11 pr-4 py-3 text-sm font-bold text-white appearance-none cursor-pointer"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">플레이어를 선택하세요</option>
              {allPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
          {stats ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              {/* Team Performance Segment */}
              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <Trophy className="w-24 h-24 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-[11px] font-black text-primary uppercase tracking-widest">Team Performance</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">{stats.team.teamName}</span>
                    <span className="text-xs text-ink-tertiary font-bold">팀 최종 성적</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-ink-tertiary uppercase mb-1">매치 승패</span>
                      <span className="text-xl font-mono font-black text-white">{stats.teamMatchWins}승 {stats.teamMatchLosses}패</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-hairline/20 pl-8">
                      <span className="text-[10px] font-black text-ink-tertiary uppercase mb-1">세트 승패</span>
                      <span className="text-xl font-mono font-black text-white">{stats.teamSetWins}승 {stats.teamSetLosses}패</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-2 border border-hairline rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                   <Target className="w-6 h-6 text-emerald-400 mb-2" />
                   <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">라운드 승률</span>
                   <span className="text-3xl font-titular text-white">{stats.roundWinRate.toFixed(1)}%</span>
                   <span className="text-[10px] text-ink-subtle mt-1 font-mono">{stats.roundWins}/{stats.totalRounds} 라운드</span>
                </div>
                <div className="bg-surface-2 border border-hairline rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                   <Trophy className="w-6 h-6 text-amber-400 mb-2" />
                   <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">세트 승률</span>
                   <span className="text-3xl font-titular text-white">{stats.setWinRate.toFixed(1)}%</span>
                   <span className="text-[10px] text-ink-subtle mt-1 font-mono">{stats.setWins}/{stats.totalSets} 세트</span>
                </div>
                <div className="bg-surface-2 border border-hairline rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                   <BarChart3 className="w-6 h-6 text-blue-400 mb-2" />
                   <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">참여 세트</span>
                   <span className="text-3xl font-titular text-white">{stats.totalSets}</span>
                   <span className="text-[10px] text-ink-subtle mt-1 font-mono">총 경기 수</span>
                </div>
              </div>

              {/* Character Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black text-white">Top 3 챔피언 승률</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {stats.topChars.length > 0 ? stats.topChars.map((char) => (
                    <div key={char.name} className="bg-black/30 border border-hairline/50 rounded-xl p-4 flex flex-col gap-1">
                      <span className="text-xs font-bold text-white truncate">{char.name}</span>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-primary shadow-[0_0_8px_rgba(225,29,72,0.4)]" 
                          style={{ width: `${char.winRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-mono text-ink-tertiary">{char.wins}승 {char.total - char.wins}패</span>
                        <span className="text-[11px] font-black text-primary">{char.winRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-3 py-8 text-center text-xs text-ink-tertiary font-medium">데이터가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* Recent History */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black text-white">최근 대전 기록</h3>
                </div>
                <div className="bg-black/20 border border-hairline rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto no-scrollbar">
                  {stats.history.length > 0 ? (
                    <div className="divide-y divide-hairline/30">
                      {stats.history.map((h, i) => {
                        const isWin = h.set.winnerTeamId === (h.isTeam1 ? h.match.team1Id : h.match.team2Id);
                        const opponent = h.isTeam1 ? h.set.team2PlayerId : h.set.team1PlayerId;
                        const opponentName = allPlayers.find(p => p.id === opponent)?.name || 'Unknown';
                        const myRounds = h.isTeam1 ? h.set.team1Rounds : h.set.team2Rounds;
                        const oppRounds = h.isTeam1 ? h.set.team2Rounds : h.set.team1Rounds;

                        return (
                          <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                                {isWin ? 'WIN' : 'LOSE'}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">vs {opponentName}</span>
                                <span className="text-[9px] font-mono text-ink-tertiary">{h.match.id} (Set {h.match.sets.indexOf(h.set) + 1})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-black text-ink-tertiary uppercase">Character</span>
                                <span className="text-[11px] font-bold text-white">{h.isTeam1 ? h.set.team1Character : h.set.team2Character}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-mono font-black text-white">{myRounds} : {oppRounds}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-ink-tertiary font-medium italic">대전 기록이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-ink-tertiary gap-3">
               <Target className="w-12 h-12 opacity-10" />
               <p className="text-sm font-medium">플레이어를 선택하여 실시간 분석 데이터를 확인하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
