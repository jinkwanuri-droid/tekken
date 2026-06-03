import React, { useState, useMemo } from 'react';
import { useTournament, computeGroupStandings } from '../store';
import { Shuffle, RotateCcw, AlertTriangle, Medal, Play, CheckCircle2, Award, Zap, Crown } from 'lucide-react';
import { MatchModal } from '../components/MatchModal';

const formatSetDiff = (diff: number, won: number, lost: number) => {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff}(${won}/${lost})`;
};

export const BracketView = ({ isAdmin }: { isAdmin: boolean }) => {
  const { state, dispatch } = useTournament();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'league' | 'tournament'>('league');
  const [isShuffling, setIsShuffling] = useState(false);

  // Group standings should be memoized to avoid expensive re-computation
  const groupAStandings = useMemo(() => computeGroupStandings(state.teams, state.matches, 'A'), [state.teams, state.matches]);
  const groupBStandings = useMemo(() => computeGroupStandings(state.teams, state.matches, 'B'), [state.teams, state.matches]);
  const groupCStandings = useMemo(() => computeGroupStandings(state.teams, state.matches, 'C'), [state.teams, state.matches]);

  // Champion Arena particles with high-density glowing effects
  const championParticles = useMemo(() => {
    const colors = ['bg-primary', 'bg-yellow-300', 'bg-white', 'bg-orange-400'];
    return [...Array(110)].map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 0.8 + Math.random() * 3.5, // Reduced size variety (0.8px ~ 4.3px) - 70% scaling
      left: `${-20 - Math.random() * 30}%`, // Start off-screen left
      top: `${Math.random() * 100}%`,
      duration: `${3.5 + Math.random() * 5}s`,
      delay: `${Math.random() * 8}s`,
      driftY: -50 - Math.random() * 110
    }));
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
        setShowShuffleConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const isHybrid = state.settings.matchFormat === 'hybrid';
  
  const numRounds = Math.max(0, ...state.matches.filter(m => !m.isGroupStage).map(m => m.round)) + 1;
  const tournamentMatchesOnly = state.matches.filter(m => !m.isGroupStage);
  
  const rounds = Array.from({ length: numRounds }).map((_, r) => {
    return tournamentMatchesOnly.filter(m => m.round === r);
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return '결정 대기 중';
    return state.teams.find(t => t.id === teamId)?.name || '결정 대기 중';
  };

  const getMatchPlaceholder = (matchId: string, side: 1 | 2): string => {
    if (matchId === 'QF_1') return side === 1 ? 'A조 1위' : 'C조 2위';
    if (matchId === 'QF_2') return side === 1 ? 'B조 1위' : 'A조 3위';
    if (matchId === 'QF_3') return side === 1 ? 'C조 1위' : 'B조 3위';
    if (matchId === 'QF_4') return side === 1 ? 'A조 2위' : 'B조 2위';
    
    if (matchId === 'SF_1') return side === 1 ? '8강 1경기 승자' : '8강 2경기 승자';
    if (matchId === 'SF_2') return side === 1 ? '8강 3경기 승자' : '8강 4경기 승자';
    
    if (matchId === 'GF_1') return side === 1 ? '4강 1경기 승자' : '4강 2경기 승자';
    
    return '대기 중';
  };

  const getTeamDisplayName = (matchId: string, teamId: string | null, side: 1 | 2) => {
    if (teamId) {
      return state.teams.find(t => t.id === teamId)?.name || '결정 대기 중';
    }
    return getMatchPlaceholder(matchId, side);
  };

  const handleShuffle = async () => {
    if (!canShuffle || isShuffling) return;
    
    setShowShuffleConfirm(false);
    setIsShuffling(true);
    
    // Perform around 20 "fake" shuffles for animation effect
    const iters = 20;
    for (let i = 0; i < iters; i++) {
      if (isHybrid) {
        dispatch({ type: 'SHUFFLE_GROUPS' });
      } else {
        dispatch({ type: 'SHUFFLE_BRACKET' });
      }
      // Speed up slightly towards the end
      const delay = 50 + (i * 2);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsShuffling(false);
  };

  const handleResetConfirm = () => {
    dispatch({ type: 'RESET_BRACKET' });
    setShowResetConfirm(false);
  };

  const canShuffle = !state.matches.some(m => 
    m.status === 'in_progress' ||
    (m.status === 'completed' && m.winnerId !== null && !m.isGroupStage) ||
    m.sets.some(s => s.winnerTeamId !== null)
  );

  return (
    <div className="flex flex-col h-full bg-canvas/30 text-white relative w-full items-center">
      <header className="w-full border-b border-hairline bg-[#140507]/40 backdrop-blur-xl z-20 shrink-0 sticky top-0 flex justify-center">
        <div className="w-full max-w-6xl px-6 py-5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col min-w-[200px]">
          <h1 className="text-xl font-titular text-white font-black flex items-center gap-2">
            <Zap className={`text-primary w-5 h-5 ${isShuffling ? 'animate-bounce' : 'animate-pulse'}`} />
            조별리그 및 토너먼트
          </h1>
          <p className="text-ink-subtle text-[11px] font-medium opacity-60">
            {isHybrid ? '3개 조 예선 및 8강 본선 매칭 시스템' : '싱글 엘리미네이션 정식 토너먼트'}
          </p>
        </div>

        {/* Centered Tabs in Header */}
        {isHybrid && (
          <div className="flex-1 flex justify-center order-3 md:order-none w-full md:w-auto">
            <div className="inline-flex p-1 bg-black/40 backdrop-blur-xl rounded-xl border border-hairline/30 shadow-inner">
              <button
                onClick={() => setActiveTab('league')}
                className={`px-6 py-2 rounded-lg text-xs font-black tracking-tighter transition-all ${
                  activeTab === 'league' 
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]' 
                    : 'text-ink-subtle hover:text-white hover:bg-white/5'
                }`}
              >
                조별 리그 예선
              </button>
              <button
                onClick={() => setActiveTab('tournament')}
                className={`px-6 py-2 rounded-lg text-xs font-black tracking-tighter transition-all ${
                  activeTab === 'tournament' 
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]' 
                    : 'text-ink-subtle hover:text-white hover:bg-white/5'
                }`}
              >
                8강 본선 토너먼트
              </button>
            </div>
          </div>
        )}
        
        {isAdmin ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => canShuffle && !isShuffling && setShowShuffleConfirm(true)}
              disabled={!canShuffle || isShuffling}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black transition-all ${
                canShuffle && !isShuffling
                  ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white shadow-[0_0_20px_rgba(225,29,72,0.1)] active:scale-95' 
                  : 'bg-surface-2/80 text-zinc-400 border border-hairline cursor-not-allowed opacity-60'
              }`}
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              {isShuffling ? '섞는 중...' : '대전 섞기'}
            </button>

            <button 
              onClick={() => setShowResetConfirm(true)}
              disabled={isShuffling}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black transition-all bg-surface-2 border border-hairline/60 text-ink-subtle hover:bg-surface-3 hover:text-white active:scale-95 disabled:opacity-30"
            >
              <RotateCcw className="w-4 h-4" />
              초기화
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 border border-[#e11d48]/20 bg-[#120305]/60 rounded-xl text-xs font-semibold text-ink-subtle select-none">
            <svg className="w-3.5 h-3.5 text-primary animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span>실시간 관전 모드</span>
          </div>
        )}
        </div>
      </header>

      {isHybrid ? (
        activeTab === 'league' ? (
          <div className="w-full flex-1 overflow-y-auto p-6 no-scrollbar">
            {/* 3 Groups Horizontal Efficient Layout */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-16">
              
              {/* Group A Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#130f11] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px]">A조</span>
                    A조 예선 리그
                  </h2>
                  <span className="text-[10px] text-primary font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto no-scrollbar mb-6 shrink-0 h-[165px] overflow-hidden">
                  <table className="w-full text-left text-[11px] table-fixed">
                    <thead>
                      <tr className="border-b border-hairline/40 text-[10px] text-zinc-400 font-normal bg-canvas/30">
                        <th className="py-2 px-2 w-[40px] font-normal">순위</th>
                        <th className="py-2 px-1 w-[100px] font-normal">팀 이름</th>
                        <th className="py-2 px-1 w-[50px] text-center font-mono font-normal animate-none">전적</th>
                        <th className="py-2 px-1 w-[100px] text-center font-mono font-normal">득실차</th>
                        <th className="py-2 px-2 w-[50px] text-right font-normal">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupAStandings.map((std, idx) => {
                        const isAdvance = idx < 3;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'animate-bg-pulse-red' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx === 2 && <span className="text-slate-400">3위</span>}
                              {idx > 2 && <span className="text-zinc-400/70">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] text-[12px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 경기 리스트 위 연한 회색 구분선 추가 */}
                <div className="border-t border-hairline/30 my-4 shrink-0"></div>

                {/* Match Lists for A */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'A').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = true;
                    
                    return (
                      <div 
                        key={match.id}
                        onClick={() => isClickable && setSelectedMatchId(match.id)}
                        className={`glass-panel p-3 rounded-xl border border-hairline/80 flex flex-col justify-between transition-all ${
                          isClickable 
                            ? 'cursor-pointer hover:border-primary/80 hover:shadow-[0_0_12px_rgba(225,29,72,0.15)] active:scale-[0.98]' 
                            : 'opacity-75 bg-[#0f1215]'
                        } ${isCompleted ? 'border-success/30' : ''}`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-2 font-semibold">
                          <span className="text-ink-tertiary">{match.id}</span>
                          {isCompleted ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">완료</span>
                          ) : match.status === 'in_progress' ? (
                            <span className="text-primary font-bold animate-pulse flex items-center gap-1">진행중</span>
                          ) : (
                            <span className="text-ink-tertiary">대기중</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team1Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team1Id)}</span>
                              {match.winnerId === match.team1Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team2Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team2Id)}</span>
                              {match.winnerId === match.team2Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team2Score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group B Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#130f11] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-500/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px]">B조</span>
                    B조 예선 리그
                  </h2>
                  <span className="text-[10px] text-purple-400 font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto no-scrollbar mb-6 shrink-0 h-[165px] overflow-hidden">
                  <table className="w-full text-left text-[11px] table-fixed">
                    <thead>
                      <tr className="border-b border-hairline/40 text-ink-subtle font-semibold bg-canvas/30">
                        <th className="py-2 px-2 w-[40px]">순위</th>
                        <th className="py-2 px-1 w-[100px]">팀 이름</th>
                        <th className="py-2 px-1 w-[50px] text-center font-mono">전적</th>
                        <th className="py-2 px-1 w-[100px] text-center font-mono">득실차</th>
                        <th className="py-2 px-2 w-[50px] text-right">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupBStandings.map((std, idx) => {
                        const isAdvance = idx < 3;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'animate-bg-pulse-red' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx === 2 && <span className="text-slate-400">3위</span>}
                              {idx > 2 && <span className="text-zinc-400/70">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] text-[12px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 경기 리스트 위 연한 회색 구분선 추가 */}
                <div className="border-t border-hairline/30 my-4 shrink-0"></div>

                {/* Match Lists for B */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'B').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = true;
                    
                    return (
                      <div 
                        key={match.id}
                        onClick={() => isClickable && setSelectedMatchId(match.id)}
                        className={`glass-panel p-3 rounded-xl border border-hairline/80 flex flex-col justify-between transition-all ${
                          isClickable 
                            ? 'cursor-pointer hover:border-primary/80 hover:shadow-[0_0_12px_rgba(225,29,72,0.15)] active:scale-[0.98]' 
                            : 'opacity-75 bg-[#0f1215]'
                        } ${isCompleted ? 'border-success/30' : ''}`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-2 font-semibold">
                          <span className="text-ink-tertiary">{match.id}</span>
                          {isCompleted ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">완료</span>
                          ) : match.status === 'in_progress' ? (
                            <span className="text-primary font-bold animate-pulse flex items-center gap-1">진행중</span>
                          ) : (
                            <span className="text-ink-tertiary">대기중</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team1Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team1Id)}</span>
                              {match.winnerId === match.team1Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team2Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team2Id)}</span>
                              {match.winnerId === match.team2Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team2Score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group C Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#130f11] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#10b981]/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded text-[10px]">C조</span>
                    C조 예선 리그
                  </h2>
                  <span className="text-[10px] text-[#10b981] font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto no-scrollbar mb-6 shrink-0 h-[165px] overflow-hidden">
                  <table className="w-full text-left text-[11px] table-fixed">
                    <thead>
                      <tr className="border-b border-hairline/40 text-ink-subtle font-semibold bg-canvas/30">
                        <th className="py-2 px-2 w-[40px]">순위</th>
                        <th className="py-2 px-1 w-[100px]">팀 이름</th>
                        <th className="py-2 px-1 w-[50px] text-center font-mono">전적</th>
                        <th className="py-2 px-1 w-[100px] text-center font-mono">득실차</th>
                        <th className="py-2 px-2 w-[50px] text-right">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupCStandings.map((std, idx) => {
                        const isAdvance = idx < 2;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'animate-bg-pulse-red' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx > 1 && <span className="text-zinc-400/70">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] text-[12px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 경기 리스트 위 연한 회색 구분선 추가 */}
                <div className="border-t border-hairline/30 my-4 shrink-0"></div>

                {/* Match Lists for C */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'C').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = true;
                    
                    return (
                      <div 
                        key={match.id}
                        onClick={() => isClickable && setSelectedMatchId(match.id)}
                        className={`glass-panel p-3 rounded-xl border border-hairline/80 flex flex-col justify-between transition-all ${
                          isClickable 
                            ? 'cursor-pointer hover:border-primary/80 hover:shadow-[0_0_12px_rgba(225,29,72,0.15)] active:scale-[0.98]' 
                            : 'opacity-75 bg-[#0f1215]'
                        } ${isCompleted ? 'border-success/30' : ''}`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-2 font-semibold">
                          <span className="text-ink-tertiary">{match.id}</span>
                          {isCompleted ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">완료</span>
                          ) : match.status === 'in_progress' ? (
                            <span className="text-primary font-bold animate-pulse flex items-center gap-1">진행중</span>
                          ) : (
                            <span className="text-ink-tertiary">대기중</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team1Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team1Id)}</span>
                              {match.winnerId === match.team1Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-[13px] font-bold px-1.5 py-0.5 rounded-md ${
                            match.winnerId === match.team2Id 
                              ? 'text-white bg-rose-500/10' 
                              : match.winnerId 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-white'
                          }`}>
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              <span>{getTeamName(match.team2Id)}</span>
                              {match.winnerId === match.team2Id && (
                                <span className="text-[9px] font-black text-emerald-400 leading-none shrink-0 ml-0.5">WIN</span>
                              )}
                            </div>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20 text-[13px] leading-tight">{match.team2Score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="w-full flex-1 overflow-auto pt-8 px-8 pb-12 no-scrollbar">
            {/* 8강 Championship Knockout Tree Layout (QF -> SF -> GF -> CHAMPION) */}
            <div className="glass-panel p-8 rounded-2xl border border-hairline/60 bg-[#130f11] max-w-6xl mx-auto mb-6">
              
              {/* Robust 4-Tier layout (QF -> SF -> GF -> CHAMPION) */}
              <div className="flex flex-row justify-between items-stretch py-2 gap-12 relative">
                
                {/* Tier 1: QF (8강전) */}
                <div className="flex flex-col justify-between gap-12 w-64 relative z-10">
                  <div className="text-[10px] text-center font-mono tracking-widest text-ink-subtle font-bold border-b border-hairline/20 pb-1.5 mb-2">
                    준준결승 (8강 BO7)
                  </div>
                  {[1, 2, 3, 4].map(idx => {
                    const qfId = `QF_${idx}`;
                    const qf = state.matches.find(m => m.id === qfId)!;
                    const hasBoth = !!qf.team1Id && !!qf.team2Id;
                    const isClickable = hasBoth;
                    
                    return (
                      <div key={qfId} className="relative flex-1 flex flex-col justify-center py-2 translate-z-0">
                        <div className="text-[9px] font-mono text-ink-tertiary mb-1 uppercase">8강 경기 {idx}</div>
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(qfId)}
                          className={`glass-panel p-3 rounded-xl border border-hairline transition-all flex flex-col gap-2 transform-gpu ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#f59e0b]/80 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-[0.98]' 
                              : 'opacity-85'
                          } ${qf.status === 'completed' ? 'border-success/30 bg-success/[0.01]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-[13px] py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${qf.winnerId === qf.team1Id ? 'text-white' : qf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-300'}`}>
                              {getTeamDisplayName(qfId, qf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded text-[13px]">{qf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${qf.winnerId === qf.team2Id ? 'text-white' : qf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-300'}`}>
                              {getTeamDisplayName(qfId, qf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded text-[13px]">{qf.team2Score}</span>
                          </div>
                        </div>

                        {/* Connection Line to SF */}
                        <div className="absolute right-[-32px] top-1/2 w-[32px] border-b-2 border-hairline/40 pointer-events-none" />
                        {idx % 2 === 1 ? (
                          <div className="absolute right-[-32px] border-r-2 border-hairline/40 pointer-events-none" style={{ top: '50%', height: 'calc(50% + 55px)' }} />
                        ) : (
                          <div className="absolute right-[-32px] border-r-2 border-hairline/40 pointer-events-none" style={{ bottom: '50%', height: 'calc(50% + 55px)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tier 2: SF (준결승전) */}
                <div className="flex flex-col justify-around w-64 relative z-10 py-12">
                  <div className="text-[10px] text-center font-mono tracking-widest text-[#a78bfa] font-bold border-b border-[#7c3aed]/20 pb-1.5 mb-2">
                    준결승전 (4강 BO7)
                  </div>
                  {[1, 2].map(idx => {
                    const sfId = `SF_${idx}`;
                    const sf = state.matches.find(m => m.id === sfId)!;
                    const hasBoth = !!sf.team1Id && !!sf.team2Id;
                    const isClickable = hasBoth;
                    
                    return (
                      <div key={sfId} className="relative flex-1 flex flex-col justify-center max-h-[160px] translate-z-0">
                        <div className="text-[9px] font-mono text-[#a78bfa] mb-1 uppercase">4강 경기 {idx}</div>
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(sfId)}
                          className={`glass-panel p-3 rounded-xl border border-[#7c3aed]/40 transition-all flex flex-col gap-2 transform-gpu ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#a78bfa]/80 hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] active:scale-[0.98]' 
                              : 'opacity-85'
                          } ${sf.status === 'completed' ? 'border-success/30 bg-success/[0.01]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-[13px] py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${sf.winnerId === sf.team1Id ? 'text-white' : sf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-300'}`}>
                              {getTeamDisplayName(sfId, sf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded text-[13px]">{sf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${sf.winnerId === sf.team2Id ? 'text-white' : sf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-300'}`}>
                              {getTeamDisplayName(sfId, sf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded text-[13px]">{sf.team2Score}</span>
                          </div>
                        </div>

                        {/* Connection Line to GF */}
                        <div className="absolute right-[-32px] top-1/2 w-[32px] border-b-2 border-[#7c3aed]/30 pointer-events-none" />
                        {idx === 1 ? (
                          <div className="absolute right-[-32px] border-r-2 border-[#7c3aed]/30 pointer-events-none" style={{ top: '50%', height: 'calc(50% + 140px)' }} />
                        ) : (
                          <div className="absolute right-[-32px] border-r-2 border-[#7c3aed]/30 pointer-events-none" style={{ bottom: '50%', height: 'calc(50% + 140px)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tier 3: GF (결승전) */}
                <div className="flex flex-col justify-center w-72 relative z-10 py-16">
                  <div className="text-[11px] text-center font-mono tracking-widest text-[#f59e0b] font-bold border-b border-[#f59e0b]/20 pb-2 mb-6">
                    그랜드 파이널 (결승전 BO7)
                  </div>
                  {(() => {
                    const gfId = 'GF_1';
                    const gf = state.matches.find(m => m.id === gfId)!;
                    const hasBoth = !!gf.team1Id && !!gf.team2Id;
                    const isClickable = hasBoth;
                    
                    return (
                      <div className={`relative flex flex-col justify-center translate-z-0 group ${isShuffling ? '' : 'animate-fade-in'}`}>
                        <div className={`absolute left-[-48px] top-1/2 w-[48px] h-[2px] pointer-events-none bg-hairline/40`} />
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(gfId)}
                          className={`glass-panel p-5 rounded-2xl border-2 border-[#f59e0b]/60 bg-gradient-to-br from-[#171109]/40 to-transparent transition-all flex flex-col gap-3 transform-gpu shadow-[0_0_30px_rgba(245,158,11,0.05)] ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#f59e0b] hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] active:scale-[0.98]' 
                              : 'opacity-90'
                          } ${gf.status === 'completed' ? 'border-success bg-success/5 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-[15px] py-1">
                            <span className={`font-black truncate max-w-[180px] tracking-tight ${gf.winnerId === gf.team1Id ? 'text-white' : gf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-200'}`}>
                              {getTeamDisplayName(gfId, gf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/70 px-2.5 py-1 rounded-md border border-[#f59e0b]/20 min-w-[32px] text-center text-[15px]">{gf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-center opacity-30 select-none">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"></div>
                            <span className="px-3 text-[10px] font-black font-titular italic">VS</span>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"></div>
                          </div>
                          <div className="flex items-center justify-between text-[15px] py-1">
                            <span className={`font-black truncate max-w-[180px] tracking-tight ${gf.winnerId === gf.team2Id ? 'text-white' : gf.winnerId ? 'text-zinc-500 line-through opacity-75' : 'text-slate-200'}`}>
                              {getTeamDisplayName(gfId, gf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/70 px-2.5 py-1 rounded-md border border-[#f59e0b]/20 min-w-[32px] text-center text-[15px]">{gf.team2Score}</span>
                          </div>
                        </div>

                        {/* Connection to Champion */}
                        <div className="absolute right-[-48px] top-1/2 w-[48px] border-b-2 border-[#f59e0b]/40 pointer-events-none" />
                      </div>
                    );
                  })()}
                </div>

                {/* Tier 4: CHAMPION AREA */}
                <div className="flex flex-col justify-center w-72 relative z-10 py-16">
                   <div className="text-[11px] text-center font-mono tracking-widest text-primary font-bold border-b border-primary/20 pb-2 mb-6">
                    격투 철권 아레나 챔피언
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {(() => {
                      const gf = state.matches.find(m => m.id === 'GF_1')!;
                      const winnerId = gf?.winnerId;
                      return (
                        <div className={`flex flex-col items-center translate-z-0 ${isShuffling ? '' : 'animate-bounce-in'}`}>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
                            
                            {/* Arena Champion Fire Particles - Higher density and better overflow handling */}
                            <div className="absolute -inset-10 z-0 pointer-events-none overflow-hidden opacity-90">
                              {championParticles.map((p) => (
                                <div 
                                  key={p.id}
                                  className={`absolute rounded-full blur-[0.6px] fire-right-flow-effect ${p.color}`}
                                  style={{ 
                                    width: `${p.size}px`,
                                    height: `${p.size}px`,
                                    left: p.left, 
                                    top: p.top,
                                    '--duration': p.duration,
                                    '--drift-y': `${p.driftY}px`,
                                    animationDelay: p.delay
                                  } as React.CSSProperties}
                                ></div>
                              ))}
                            </div>

                            <div className={`relative glass-panel bg-gradient-to-b ${winnerId ? 'from-[#f59e0b]/15 to-[#1c1404]' : 'from-[#e11d48]/10 to-[#120407]'} border-2 ${winnerId ? 'border-[#f59e0b] shadow-[0_0_50px_rgba(245,158,11,0.25)]' : 'border-primary/50 shadow-[0_0_35px_rgba(225,29,72,0.2)]'} p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transform-gpu transition-all duration-300`}>
                              {winnerId ? (
                                <div className="bg-gradient-to-tr from-[#f59e0b] to-yellow-200 p-4 rounded-full shadow-lg">
                                  <Medal className="w-10 h-10 text-[#140507]" />
                                </div>
                              ) : (
                                <div className="bg-gradient-to-tr from-primary/30 to-rose-400 p-4 rounded-full shadow-lg border border-primary/20 relative animate-pulse">
                                  <Crown className="w-10 h-10 text-white" />
                                </div>
                              )}
                              
                              <div className="text-center min-w-[160px]">
                                <div className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">
                                  {winnerId ? 'CHAMPION' : 'CHAMPIONSHIP'}
                                </div>
                                <div className="text-xl font-titular font-extrabold text-white whitespace-nowrap drop-shadow-lg">
                                  {winnerId ? getTeamName(winnerId) : '최종 우승팀 결정 중'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-8 flex gap-1">
                            {[1, 2, 3].map(i => (
                              <div key={i} className={`w-1 h-8 bg-gradient-to-b ${winnerId ? 'from-[#f59e0b]/40' : 'from-primary/40'} to-transparent rounded-full`}></div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      ) : (
        <div className="w-full flex-1 overflow-auto p-8 scrollbar-hidden">
          {/* Standard Elegant Tournament Layout */}
          <div className="flex justify-start items-start min-w-max h-full gap-16 px-4 pb-24 max-w-6xl mx-auto">
            {rounds.map((roundMatches, rIdx) => {
              const BASE_HEIGHT = 145; // Comfortable spacing for cards
              const matchBoxHeight = BASE_HEIGHT * Math.pow(2, rIdx);
              const sortedMatches = [...roundMatches].sort((a, b) => a.matchIndex - b.matchIndex);

              return (
                <div key={rIdx} className="flex flex-col w-64 shrink-0 relative pt-12">
                  {/* Round Header */}
                  <div className="absolute top-0 w-full text-center text-xs font-bold tracking-widest uppercase text-ink-subtle border-b border-hairline/20 pb-2">
                    {rIdx === numRounds - 1 ? '결승전 (Grand Final)' : rIdx === numRounds - 2 ? '준결승전 (Semi-Final)' : `${Math.pow(2, numRounds - rIdx)}강전`}
                  </div>
                  
                  {sortedMatches.map((match, mIdx) => {
                    const hasBothTeams = !!match.team1Id && !!match.team2Id;
                    const isClickable = hasBothTeams;
                    const isCompleted = match.status === 'completed';

                    return (
                      <div 
                        key={match.id} 
                        className="relative flex flex-col justify-center"
                        style={{ height: `${matchBoxHeight}px` }}
                      >
                        
                        {/* Upper TBD placeholder line if preceding is not finalized */}
                        <div className="text-center text-[10px] font-mono tracking-wider text-ink-tertiary mb-1 uppercase opacity-60">
                          Match {match.matchIndex + 1}
                        </div>
    
                        {/* The Match Card */}
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(match.id)}
                          className={`glass-panel overflow-hidden flex flex-col z-10 transition-all transform-gpu translate-z-0 ${
                            match.status === 'in_progress' ? 'active-match match-box' : ''
                          } ${
                            isClickable 
                              ? 'cursor-pointer hover:border-primary/80 hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-gradient-to-r hover:from-[#1b0507]/20 hover:to-transparent active:scale-[0.99]' 
                              : 'opacity-85'
                          } ${
                            isCompleted ? 'border-success/30 bg-success/[0.02]' : 'border-hairline'
                          }`}
                        >
                          {/* Team 1 */}
                          <div className={`flex items-center justify-between p-3 border-b border-hairline/50 transition-all ${
                            match.winnerId === match.team1Id 
                              ? 'bg-white/10 text-white font-black' 
                              : match.winnerId && match.winnerId !== match.team1Id 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-ink'
                          }`}>
                            <span className="text-sm truncate w-3/4 font-medium">
                              {getTeamName(match.team1Id)}
                            </span>
                            <span className="font-mono text-sm font-bold bg-black/30 px-2 py-0.5 rounded border border-hairline/20 min-w-[24px] text-center">
                              {match.team1Score}
                            </span>
                          </div>
    
                          {/* Team 2 */}
                          <div className={`flex items-center justify-between p-3 transition-all ${
                            match.winnerId === match.team2Id 
                              ? 'bg-white/10 text-white font-black' 
                              : match.winnerId && match.winnerId !== match.team2Id 
                                ? 'text-zinc-500 line-through opacity-75' 
                                : 'text-ink'
                          }`}>
                            <span className="text-sm truncate w-3/4 font-medium">
                              {getTeamName(match.team2Id)}
                            </span>
                            <span className="font-mono text-sm font-bold bg-black/30 px-2 py-0.5 rounded border border-hairline/20 min-w-[24px] text-center">
                              {match.team2Score}
                            </span>
                          </div>
                        </div>
    
                        {/* Status overlay hints */}
                        <div className="absolute -bottom-1.5 left-0 w-full text-center pointer-events-none z-20">
                          {match.status === 'in_progress' && (
                            <span className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded border border-primary/50 uppercase tracking-wider animate-pulse">
                              진행중 (LIVE)
                            </span>
                          )}
                          {isCompleted && (
                            <span className="bg-success text-white text-[9px] font-bold px-2 py-0.5 rounded border border-success/50 uppercase tracking-wider">
                              종료 (DONE)
                            </span>
                          )}
                          {hasBothTeams && match.status === 'pending' && (
                            <span className="bg-surface-3 text-ink-subtle text-[9px] font-bold px-2 py-0.5 rounded border border-hairline uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                              경기 대기
                            </span>
                          )}
                        </div>
    
                        {/* Connecting lines */}
                        {/* Horizontal line going to the right (halfway across the gap) */}
                        {rIdx < numRounds - 1 && (
                          <div className="absolute right-[-32px] top-1/2 w-[32px] border-b-2 border-hairline/40 pointer-events-none" />
                        )}
                        
                        {/* Horizontal line coming from the left (halfway across the gap) */}
                        {rIdx > 0 && (
                          <div className="absolute left-[-32px] top-1/2 w-[32px] border-b-2 border-hairline/40 pointer-events-none" />
                        )}
                        
                        {/* Vertical connection linking matches */}
                        {rIdx < numRounds - 1 && mIdx % 2 === 0 && (
                          <div 
                            className="absolute right-[-32px] border-r-2 border-hairline/40 pointer-events-none" 
                            style={{ top: '50%', height: `${matchBoxHeight / 2}px` }} 
                          />
                        )}
                        {rIdx < numRounds - 1 && mIdx % 2 !== 0 && (
                          <div 
                            className="absolute right-[-32px] border-r-2 border-hairline/40 pointer-events-none" 
                            style={{ bottom: '50%', height: `${matchBoxHeight / 2}px` }} 
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match modal for live score recording and editing */}
      {selectedMatchId && (
        <MatchModal 
          matchId={selectedMatchId} 
          onClose={() => setSelectedMatchId(null)} 
          isAdmin={isAdmin}
        />
      )}

      {/* Shuffle confirmation modal */}
      {showShuffleConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShuffleConfirm(false)}
          />
          <div 
            className="w-full max-w-md bg-[#0c0f12] border border-hairline p-6 rounded-xl shadow-2xl flex flex-col cursor-default z-10"
          >
            <div className="flex items-center gap-3 text-primary mb-3">
              <Shuffle className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-titular text-white font-bold">대진 무작위 섞기</h3>
            </div>
            
            <p className="text-ink-subtle text-xs leading-relaxed mb-6">
              현재 참여 팀 목록과 조를 무작위로 다시 섞으시겠습니까?<br />
              <span className="text-primary font-semibold">대진을 섞으면 진행되지 않은 현재 대진 정보가 변경됩니다.</span>
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowShuffleConfirm(false)}
                className="px-4 py-2 rounded text-xs font-semibold border border-hairline/60 hover:bg-surface-1 transition-all"
              >
                취소
              </button>
              <button 
                type="button"
                onClick={handleShuffle}
                className="px-4 py-2 rounded text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-[0_0_15px_rgba(225,29,72,0.25)] transition-all"
              >
                대전 섞기 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div 
          onClick={() => setShowResetConfirm(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0c0f12] border border-hairline p-6 rounded-xl shadow-2xl flex flex-col cursor-default"
          >
            <div className="flex items-center gap-3 text-primary mb-3">
              <AlertTriangle className="w-6 h-6 text-[#e11d48]" />
              <h3 className="text-lg font-titular text-white font-bold">대진 초기화 경고</h3>
            </div>
            
            <p className="text-ink-subtle text-xs leading-relaxed mb-6">
              정말로 현재 진행 중인 모든 조별 예선 및 본선 토너먼트 경기 기록을 초기화하시겠습니까?<br />
              <span className="text-primary font-semibold">진행된 파이터 매치 데이터는 복구 불가능합니다.</span>
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded text-xs font-semibold border border-hairline/60 hover:bg-surface-1 transition-all"
              >
                취소
              </button>
              <button 
                type="button"
                onClick={handleResetConfirm}
                className="px-4 py-2 rounded text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-[0_0_15px_rgba(225,29,72,0.25)] transition-all"
              >
                예, 초기화합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
