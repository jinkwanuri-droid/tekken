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
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const allPlayers = useMemo(() => {
    return state.teams.flatMap(t => t.players);
  }, [state.teams]);

  const stats = useMemo(() => {
    if (!selectedTeamId && !selectedPlayerId) return null;

    const matches: MatchItem[] = state.matches;
    const allPlayersList = state.teams.flatMap(t => t.players);

    // Identify active team and player
    let activeTeam = state.teams.find(t => t.id === selectedTeamId);
    let activePlayer: Player | undefined = undefined;

    if (selectedPlayerId) {
      activePlayer = allPlayersList.find(p => p.id === selectedPlayerId);
      if (activePlayer && !selectedTeamId) {
        // Automatically align team if only player is selected (safeguard)
        activeTeam = state.teams.find(t => t.players.some(p => p.id === activePlayer!.id));
      }
    }

    if (!activeTeam) return null;

    const team = activeTeam;
    const teamMatches = matches.filter(m => m.team1Id === team.id || m.team2Id === team.id);
    const teamMatchWins = teamMatches.filter(m => m.winnerId === team.id).length;
    const teamMatchLosses = teamMatches.filter(m => m.status === 'completed' && m.winnerId && m.winnerId !== team.id).length;

    let teamSetWins = 0;
    let teamSetLosses = 0;
    let teamRoundWins = 0;
    let teamRoundLosses = 0;
    teamMatches.forEach(m => {
      if (m.team1Id === team.id) {
        teamSetWins += m.team1Score;
        teamSetLosses += m.team2Score;
      } else {
        teamSetWins += m.team2Score;
        teamSetLosses += m.team1Score;
      }

      m.sets.forEach(s => {
        if (m.team1Id === team.id) {
          teamRoundWins += (s.team1Rounds || 0);
          teamRoundLosses += (s.team2Rounds || 0);
        } else {
          teamRoundWins += (s.team2Rounds || 0);
          teamRoundLosses += (s.team1Rounds || 0);
        }
      });
    });

    if (activePlayer) {
      // --- PLAYER SPECIFIC STATS ---
      const playerSets: { set: MatchSet; match: MatchItem; isTeam1: boolean }[] = [];
      matches.forEach(m => {
        m.sets.forEach(s => {
          if (s.team1PlayerId === activePlayer!.id) {
            playerSets.push({ set: s, match: m, isTeam1: true });
          } else if (s.team2PlayerId === activePlayer!.id) {
            playerSets.push({ set: s, match: m, isTeam1: false });
          }
        });
      });

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
        .sort((a, b) => b.total - a.total || b.winRate - a.winRate)
        .slice(0, 3);

      const history = playerSets
        .sort((a, b) => b.match.id.localeCompare(a.match.id))
        .slice(0, 10)
        .map(ps => {
          const isWin = ps.set.winnerTeamId === (ps.isTeam1 ? ps.match.team1Id : ps.match.team2Id);
          const opponentId = ps.isTeam1 ? ps.set.team2PlayerId : ps.set.team1PlayerId;
          const opponentName = allPlayersList.find(p => p.id === opponentId)?.name || 'Unknown';
          const myRounds = ps.isTeam1 ? ps.set.team1Rounds : ps.set.team2Rounds;
          const oppRounds = ps.isTeam1 ? ps.set.team2Rounds : ps.set.team1Rounds;
          const label = `${ps.match.id} (Set ${ps.match.sets.indexOf(ps.set) + 1})`;
          const myChar = ps.isTeam1 ? ps.set.team1Character : ps.set.team2Character;
          const oppChar = ps.isTeam1 ? ps.set.team2Character : ps.set.team1Character;

          return {
            isWin,
            opponentName,
            label,
            myCharacter: myChar || '미지정',
            opponentCharacter: oppChar || '미지정',
            scoreRatio: `${myRounds} : ${oppRounds}`
          };
        });

      return {
        mode: 'player' as const,
        player: activePlayer,
        team,
        teamMatchWins,
        teamMatchLosses,
        teamSetWins,
        teamSetLosses,
        teamRoundWins,
        teamRoundLosses,
        totalSets,
        setWins,
        setWinRate,
        totalRounds,
        roundWins,
        roundWinRate,
        topChars,
        history
      };
    } else {
      // --- TEAM-WIDE STATS ---
      const teamSets: { set: MatchSet; match: MatchItem; isTeam1: boolean }[] = [];
      matches.forEach(m => {
        const isTeam1 = m.team1Id === team.id;
        const isTeam2 = m.team2Id === team.id;
        if (isTeam1 || isTeam2) {
          m.sets.forEach(s => {
            if (s.winnerTeamId) {
              teamSets.push({ set: s, match: m, isTeam1 });
            }
          });
        }
      });

      const totalSets = teamSets.length;
      const setWins = teamSets.filter(ts => ts.set.winnerTeamId === team.id).length;
      const setWinRate = totalSets > 0 ? (setWins / totalSets) * 100 : 0;

      let totalRounds = 0;
      let roundWins = 0;
      const charStats: Record<string, { wins: number; total: number }> = {};

      teamSets.forEach(ts => {
        const pRounds = ts.isTeam1 ? (ts.set.team1Rounds || 0) : (ts.set.team2Rounds || 0);
        const oRounds = ts.isTeam1 ? (ts.set.team2Rounds || 0) : (ts.set.team1Rounds || 0);
        totalRounds += (pRounds + oRounds);
        roundWins += pRounds;

        const char = ts.isTeam1 ? ts.set.team1Character : ts.set.team2Character;
        if (char) {
          if (!charStats[char]) charStats[char] = { wins: 0, total: 0 };
          charStats[char].total += 1;
          if (ts.set.winnerTeamId === team.id) {
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
        .sort((a, b) => b.total - a.total || b.winRate - a.winRate)
        .slice(0, 3);

      const history = teamMatches
        .filter(m => m.status === 'completed')
        .sort((a, b) => b.id.localeCompare(a.id))
        .slice(0, 10)
        .map(m => {
          const isTeam1 = m.team1Id === team.id;
          const isWin = m.winnerId === team.id;
          const opponentId = isTeam1 ? m.team2Id : m.team1Id;
          const opponentName = state.teams.find(t => t.id === opponentId)?.name || 'Unknown';
          const myScore = isTeam1 ? m.team1Score : m.team2Score;
          const oppScore = isTeam1 ? m.team2Score : m.team1Score;
          
          let roundStageStr = m.isGroupStage ? `${m.groupName}조 예선` : '본선 8강';
          if (m.id.startsWith('QF_')) roundStageStr = '8강 본선';
          if (m.id.startsWith('SF_')) roundStageStr = '4강 준결승';
          if (m.id.startsWith('GF_')) roundStageStr = '결승전';

          const myCharsSet = new Set<string>();
          const oppCharsSet = new Set<string>();
          m.sets.forEach(s => {
            const myC = isTeam1 ? s.team1Character : s.team2Character;
            const oppC = isTeam1 ? s.team2Character : s.team1Character;
            if (myC) myCharsSet.add(myC);
            if (oppC) oppCharsSet.add(oppC);
          });
          const myCharactersString = Array.from(myCharsSet).join(', ') || '미지정';
          const oppCharactersString = Array.from(oppCharsSet).join(', ') || '미지정';

          return {
            isWin,
            opponentName,
            label: `${m.id} (${roundStageStr})`,
            myCharacter: myCharactersString,
            opponentCharacter: oppCharactersString,
            scoreRatio: `${myScore} : ${oppScore}`
          };
        });

      return {
        mode: 'team' as const,
        player: null,
        team,
        teamMatchWins,
        teamMatchLosses,
        teamSetWins,
        teamSetLosses,
        teamRoundWins,
        teamRoundLosses,
        totalSets,
        setWins,
        setWinRate,
        totalRounds,
        roundWins,
        roundWinRate,
        topChars,
        history
      };
    }
  }, [selectedTeamId, selectedPlayerId, state.matches, state.teams]);

  const finalStage = useMemo(() => {
    if (!stats) return null;
    const teamId = stats.team.id;
    
    // Find all matches the team participated in
    const teamMatches = state.matches.filter(m => m.team1Id === teamId || m.team2Id === teamId);
    const playOffMatches = teamMatches.filter(m => !m.isGroupStage);
    
    if (playOffMatches.length === 0) {
      return { label: '조별 예선', color: 'bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/20 shadow-[0_0_8px_rgba(255,70,85,0.1)]' };
    }
    
    // Check if team won the Grand Finals
    const gf = playOffMatches.find(m => m.id === 'GF_1');
    if (gf) {
      if (gf.status === 'completed') {
        if (gf.winnerId === teamId) {
          return { label: '🏆 우승', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]' };
        } else {
          return { label: '🥈 준우승', color: 'bg-slate-400/20 text-slate-350 border border-slate-400/30' };
        }
      }
      return { label: '🏅 결승 진출', color: 'bg-[#ff4655]/20 text-primary border border-[#ff4655]/30 shadow-[0_0_8px_rgba(255,70,85,0.25)] animate-pulse' };
    }
    
    // Check if team played / won Semifinals
    const sfList = playOffMatches.filter(m => m.id.startsWith('SF_'));
    if (sfList.length > 0) {
      const wonSf = sfList.some(m => m.status === 'completed' && m.winnerId === teamId);
      if (wonSf) {
        return { label: '🏅 결승 진출', color: 'bg-[#ff4655]/20 text-primary border border-[#ff4655]/30 shadow-[0_0_8px_rgba(255,70,85,0.25)]' };
      }
      return { label: '4강', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
    }
    
    // Check if team played / won Quarterfinals
    const qfList = playOffMatches.filter(m => m.id.startsWith('QF_'));
    if (qfList.length > 0) {
      const wonQf = qfList.some(m => m.status === 'completed' && m.winnerId === teamId);
      if (wonQf) {
        return { label: '4강 진출', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
      }
      return { label: '8강', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
    }
    
    return { label: '조별 예선', color: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' };
  }, [stats, state.matches]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0c0f12] border border-hairline rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh]">
        {/* Fixed Header with Integrated Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-hairline bg-surface-2 shrink-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-black text-white tracking-tight">상세 분석</h2>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 max-w-xl">
            {/* Team Selector */}
            <div className="relative w-full sm:w-[180px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Users className="w-3.5 h-3.5 text-ink-tertiary" />
              </div>
              <select
                className="w-full pl-9 pr-8 py-2 text-xs font-bold text-white appearance-none cursor-pointer bg-[#14181c] border border-hairline/60 rounded-xl hover:border-primary/50 transition-colors focus:outline-none"
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setSelectedPlayerId(''); // Reset player output
                }}
              >
                <option value="">팀 선택</option>
                {state.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-tertiary">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Player Selector */}
            <div className="relative w-full sm:w-[180px]">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-ink-tertiary" />
              </div>
              <select
                className={`w-full pl-9 pr-8 py-2 text-xs font-bold text-white appearance-none cursor-pointer bg-[#14181c] border border-hairline/60 rounded-xl hover:border-primary/50 transition-colors focus:outline-none ${
                  !selectedTeamId ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                disabled={!selectedTeamId}
              >
                {!selectedTeamId ? (
                  <option value="">플레이어 선택</option>
                ) : (
                  <>
                    <option value="">팀 전체 성적 분석</option>
                    {(state.teams.find(t => t.id === selectedTeamId)?.players || []).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </>
                )}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-tertiary">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-ink-subtle hover:text-white transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
          {stats ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              {/* Team Performance Segment */}
              <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                   <Trophy className="w-24 h-24 text-primary" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-[11px] font-black text-primary uppercase tracking-widest">
                    {stats.mode === 'player' ? 'PLAYER & TEAM METRICS' : 'TEAM ACCUMULATED PERFORMANCE'}
                  </h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-black text-white">
                        {stats.mode === 'player' ? `${stats.player?.name} (${stats.team.name})` : stats.team.name}
                      </span>
                      {finalStage && (
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg ${finalStage.color}`}>
                          {finalStage.label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-ink-tertiary font-bold mt-1.5">
                      {stats.mode === 'player' ? '지정 플레이어 핵심 전적 분석 리포트' : '팀 소속 전체 선수 세트 합산 성적 리포트'}
                    </span>
                  </div>
                  <div className="flex gap-6 flex-wrap">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-ink-tertiary uppercase mb-1">팀 매치 전적</span>
                      <span className="text-xl font-mono font-black text-white">{stats.teamMatchWins}승 {stats.teamMatchLosses}패</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-hairline/20 pl-6">
                      <span className="text-[10px] font-black text-ink-tertiary uppercase mb-1">팀 세트 전적</span>
                      <span className="text-xl font-mono font-black text-white">{stats.teamSetWins}승 {stats.teamSetLosses}패</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-hairline/20 pl-6">
                      <span className="text-[10px] font-black text-ink-tertiary uppercase mb-1">팀 라운드 전적</span>
                      <span className="text-xl font-mono font-black text-white">{stats.teamRoundWins}승 {stats.teamRoundLosses}패</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-2 border border-hairline rounded-2xl p-4 flex flex-col items-center justify-center text-center h-[156px] shrink-0 overflow-hidden">
                   <Target className="w-6 h-6 text-emerald-400 mb-1.5" />
                   <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">누적 라운드 승률</span>
                   <span className="text-3xl font-titular text-white mt-1">{stats.roundWinRate.toFixed(1)}%</span>
                   <span className="text-[10px] text-ink-subtle mt-1 font-mono">{stats.roundWins}/{stats.totalRounds} 라운드</span>
                </div>
                <div className="bg-surface-2 border border-hairline rounded-2xl p-4 flex flex-col items-center justify-center text-center h-[156px] shrink-0 overflow-hidden">
                   <Trophy className="w-6 h-6 text-amber-400 mb-1.5" />
                   <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">누적 세트 승률</span>
                   <span className="text-3xl font-titular text-white mt-1">{stats.setWinRate.toFixed(1)}%</span>
                   <span className="text-[10px] text-ink-subtle mt-1 font-mono">{stats.setWins}/{stats.totalSets} 세트</span>
                </div>
                {/* Repositioned Card 3: Preferred Characters TOP 3 with Round/Match Wins & Win Rates */}
                <div className="bg-surface-2 border border-hairline rounded-2xl p-4 flex flex-col h-[156px] justify-between shrink-0 overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-1.5 justify-center shrink-0">
                    <Target className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-black text-ink-tertiary uppercase tracking-widest">선호 캐릭터 TOP 3</span>
                  </div>
                  <div className="flex-grow flex flex-col justify-center min-h-0">
                    {stats.topChars.length > 0 ? (
                      <div className="space-y-1 w-full shrink-0">
                        {stats.topChars.map((char, index) => (
                          <div key={char.name} className="flex items-center justify-between bg-black/25 p-1 px-2.5 rounded-lg border border-hairline/20 h-7">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[9px] font-black text-purple-400 shrink-0">#{index+1}</span>
                              <span className="text-xs font-bold text-white truncate max-w-[85px] sm:max-w-[100px]">{char.name}</span>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-[9px] font-mono text-zinc-400">{char.wins}승 {char.total - char.wins}패</span>
                              <span className="text-xs font-mono font-black text-primary">{char.winRate.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-[10px] text-ink-tertiary italic py-3 shrink-0">
                        기용 기록이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent History - Utilizing the main visual content area widely */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black text-white">
                    {stats.mode === 'player' ? '최근 개인 대전 기록 (최대 10개 세트)' : '최근 소속 팀 경기 기록 (최대 10개 매치)'}
                  </h3>
                </div>
                <div className="bg-black/20 border border-hairline rounded-xl overflow-hidden max-h-[380px] overflow-y-auto no-scrollbar">
                  {stats.history.length > 0 ? (
                    <div className="divide-y divide-hairline/20">
                      {stats.history.map((h, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 h-12 hover:bg-white/[0.02] transition-colors leading-none">
                          {/* Col 1: Status & Opponent (Fixed width to avoid layout shift) */}
                          <div className="flex items-center gap-3 w-[150px] sm:w-[170px] shrink-0 min-w-0">
                            <span className={`w-12 text-center text-[10px] font-black py-1 rounded shrink-0 ${h.isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 text-rose-450/95 text-rose-400'}`}>
                              {h.isWin ? 'WIN' : 'LOSE'}
                            </span>
                            <span className="text-xs font-bold text-white truncate text-left min-w-0">
                              vs {h.opponentName}
                            </span>
                          </div>

                          {/* Col 2: Match ID & Set number / stage (Fixed width to avoid shifts) */}
                          <div className="w-[110px] sm:w-[130px] shrink-0 text-left font-mono text-[10px] text-zinc-500 truncate select-none">
                            {h.label}
                          </div>

                          {/* Col 3: Picks (Mine vs Opponent) - Dynamically absorbs remaining space with truncation */}
                          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 min-w-0">
                            <span className="text-[11px] font-black text-emerald-400 shrink-0 truncate max-w-[80px] sm:max-w-[110px] bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 text-center">
                              {h.myCharacter}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-zinc-600 shrink-0 select-none">vs</span>
                            <span className="text-[11px] font-black text-rose-400 shrink-0 truncate max-w-[80px] sm:max-w-[110px] bg-rose-500/5 px-2 py-1 rounded-md border border-rose-500/10 text-center">
                              {h.opponentCharacter}
                            </span>
                          </div>

                          {/* Col 4: Score (Fixed width aligned right) */}
                          <div className="w-[60px] sm:w-[80px] shrink-0 text-right">
                            <span className="text-sm font-mono font-black text-white">{h.scoreRatio}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-ink-tertiary font-medium italic">대전 기록이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-ink-tertiary gap-3">
               <Target className="w-12 h-12 opacity-15 animate-pulse" />
               <p className="text-sm font-medium">스탯 조회를 위해 분석할 팀과 플레이어를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
