import React, { useState } from 'react';
import { useTournament, computeGroupStandings } from '../store';
import { Shuffle, RotateCcw, AlertTriangle, Medal, Play, CheckCircle2, Award, Zap } from 'lucide-react';
import { MatchModal } from '../components/MatchModal';

const formatSetDiff = (diff: number, won: number, lost: number) => {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff}(${won}/${lost})`;
};

export const BracketView = () => {
  const { state, dispatch } = useTournament();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'league' | 'tournament'>('league');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowResetConfirm(false);
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

  const handleShuffle = () => {
    if (isHybrid) {
      dispatch({ type: 'SHUFFLE_GROUPS' });
    } else {
      dispatch({ type: 'SHUFFLE_BRACKET' });
    }
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
    <div className="flex flex-col h-full bg-canvas/30 text-white">
      <header className="p-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 bg-[#140507]/20 backdrop-blur-md z-10 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-titular text-white font-black flex items-center gap-2">
            <Zap className="text-primary w-5 h-5 animate-pulse" />
            {isHybrid ? '조별리그 및 결승 토너먼트' : '토너먼트 대진표'}
          </h1>
          <p className="text-ink-subtle text-xs">
            {isHybrid 
              ? '조별리그를 3개 조로 구성하고, 상위 8개팀이 8강 토너먼트로 연결됩니다.' 
              : '토너먼트 대형 대진 카드를 클릭하여 챔피언십 경기를 기획하세요.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShuffle}
            disabled={!canShuffle}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-bold transition-all cursor-pointer ${
              canShuffle 
                ? 'bg-primary hover:bg-primary-hover text-white shadow-[0_0_15px_rgba(225,29,72,0.25)] border border-primary/30' 
                : 'bg-surface-2 text-ink-tertiary border border-hairline cursor-not-allowed opacity-40'
            }`}
            title={!canShuffle ? "경기 데이터 및 세트 승패 이력이 있어 섞을 수 없습니다. 대진 초기화를 먼저 실행하세요." : "처음 참가 조 및 팀을 랜덤하게 재분배합니다."}
          >
            <Shuffle className="w-4 h-4" />
            {isHybrid ? '대전 섞기' : '대진 섞기'}
          </button>

          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-bold transition-all cursor-pointer bg-surface-2 border border-hairline/60 hover:bg-surface-3 text-ink hover:text-primary-hover hover:border-primary/50"
          >
            <RotateCcw className="w-4 h-4 text-ink-subtle" />
            초기화
          </button>
        </div>
      </header>

      {isHybrid && (
        <div className="bg-[#0c0e11]/80 border-b border-hairline/80 px-6 py-2 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('league')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'league' 
                ? 'bg-primary/20 text-primary border border-primary/40' 
                : 'text-ink-subtle hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            조별 리그 예선 (A, B, C조)
          </button>
          <button
            onClick={() => setActiveTab('tournament')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tournament' 
                ? 'bg-primary/20 text-primary border border-primary/40' 
                : 'text-ink-subtle hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            8강 본선 토너먼트 (Championship)
          </button>
        </div>
      )}

      {isHybrid ? (
        activeTab === 'league' ? (
          // 3 Groups Horizontal Efficient Layout
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-16">
              
              {/* Group A Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#0d1013] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[10px]">A조</span>
                    A조 예선 리그
                  </h2>
                  <span className="text-[10px] text-primary font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto mb-6 shrink-0 h-[165px] overflow-hidden">
                  <table className="w-full text-left text-[11px] table-fixed">
                    <thead>
                      <tr className="border-b border-hairline/40 text-ink-subtle font-semibold bg-canvas/30">
                        <th className="py-2 px-2 w-[40px]">순위</th>
                        <th className="py-2 px-1 w-[100px]">팀 이름</th>
                        <th className="py-2 px-1 w-[50px] text-center font-mono animate-none">전적</th>
                        <th className="py-2 px-1 w-[100px] text-center font-mono">득실차</th>
                        <th className="py-2 px-2 w-[50px] text-right">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computeGroupStandings(state.teams, state.matches, 'A').map((std, idx) => {
                        const isAdvance = idx < 3;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'bg-primary/5/10' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx === 2 && <span className="text-slate-400">3위</span>}
                              {idx > 2 && <span className="text-ink-tertiary">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-ink-tertiary">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Match Lists for A */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'A').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = match.status !== 'completed';
                    
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
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team1Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team1Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team2Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team2Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team2Score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group B Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#0d1013] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-500/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px]">B조</span>
                    B조 예선 리그
                  </h2>
                  <span className="text-[10px] text-purple-400 font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto mb-6 shrink-0 h-[165px] overflow-hidden">
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
                      {computeGroupStandings(state.teams, state.matches, 'B').map((std, idx) => {
                        const isAdvance = idx < 3;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'bg-purple-500/5/10' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx === 2 && <span className="text-slate-400">3위</span>}
                              {idx > 2 && <span className="text-ink-tertiary">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-ink-tertiary">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Match Lists for B */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'B').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = match.status !== 'completed';
                    
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
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team1Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team1Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team2Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team2Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team2Score}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group C Section */}
              <div className="glass-panel p-5 pt-8 rounded-2xl border border-hairline/60 bg-[#0d1013] relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#10b981]/80"></div>
                
                <div className="flex items-center justify-between mb-4 pl-3">
                  <h2 className="text-sm font-titular text-white font-extrabold flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 rounded text-[10px]">C조</span>
                    C조 예선 리그
                  </h2>
                  <span className="text-[10px] text-[#10b981] font-mono tracking-wider">5전3선승제</span>
                </div>

                {/* Standing Table with fixed heights & columns */}
                <div className="overflow-x-auto mb-6 shrink-0 h-[165px] overflow-hidden">
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
                      {computeGroupStandings(state.teams, state.matches, 'C').map((std, idx) => {
                        const isAdvance = idx < 2;
                        return (
                          <tr 
                            key={std.teamId} 
                            className={`border-b border-hairline/10 hover:bg-white/5 transition-colors ${
                              isAdvance ? 'bg-[#10b981]/5/10' : ''
                            }`}
                          >
                            <td className="py-2 px-2 w-[40px] font-mono font-bold text-ink">
                              {idx === 0 && <span className="text-[#f59e0b]">1위</span>}
                              {idx === 1 && <span className="text-slate-300">2위</span>}
                              {idx > 1 && <span className="text-ink-tertiary">{idx + 1}위</span>}
                            </td>
                            <td className="py-2 px-1 w-[100px] font-bold text-white truncate">{std.teamName}</td>
                            <td className="py-2 px-1 w-[50px] text-center font-mono text-ink-subtle">{std.won}승 {std.lost}패</td>
                            <td className={`py-2 px-1 w-[100px] text-center font-mono font-bold ${std.setDiff > 0 ? 'text-emerald-500' : std.setDiff < 0 ? 'text-red-500' : 'text-ink-tertiary'}`}>
                              {formatSetDiff(std.setDiff, std.setsWon, std.setsLost)}
                            </td>
                            <td className="py-2 px-2 w-[50px] text-right font-bold text-[10px]">
                              {isAdvance ? (
                                <span className="text-[10px] font-bold text-emerald-400">진출</span>
                              ) : (
                                <span className="text-[10px] text-ink-tertiary">탈락</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Match Lists for C */}
                <h4 className="text-[10px] text-ink-subtle uppercase font-mono tracking-widest pl-3 mb-3">경기 리스트 (터치 조율)</h4>
                <div className="space-y-3">
                  {state.matches.filter(m => m.isGroupStage && m.groupName === 'C').map((match) => {
                    const isCompleted = match.status === 'completed';
                    const isClickable = match.status !== 'completed';
                    
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
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team1Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team1Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team1Score}</span>
                          </div>
                          <div className={`flex items-center justify-between text-xs font-bold ${match.winnerId === match.team2Id ? 'text-primary' : 'text-white'}`}>
                            <span className="truncate max-w-[150px]">{getTeamName(match.team2Id)}</span>
                            <span className="font-mono bg-black/40 px-1 rounded border border-hairline/20">{match.team2Score}</span>
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
          // 8강 Championship Knockout Tree Layout (QF -> SF -> GF -> CHAMPION)
          <div className="flex-1 overflow-auto pt-8 px-8 pb-12 scrollbar-hidden">
            <div className="glass-panel p-8 rounded-2xl border border-hairline/60 bg-[#0d1013] max-w-[1240px] mx-auto mb-6">
              
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
                    const isClickable = hasBoth && qf.status !== 'completed';
                    
                    return (
                      <div key={qfId} className="relative flex-1 flex flex-col justify-center py-2">
                        <div className="text-[9px] font-mono text-ink-tertiary mb-1 uppercase">8강 경기 {idx}</div>
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(qfId)}
                          className={`glass-panel p-3 rounded-xl border border-hairline transition-all flex flex-col gap-2 ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#f59e0b]/80 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-[0.98]' 
                              : 'opacity-85'
                          } ${qf.status === 'completed' ? 'border-success/30 bg-success/[0.01]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-xs py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${qf.winnerId === qf.team1Id ? 'text-primary' : 'text-slate-300'}`}>
                              {getTeamDisplayName(qfId, qf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded">{qf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${qf.winnerId === qf.team2Id ? 'text-primary' : 'text-slate-300'}`}>
                              {getTeamDisplayName(qfId, qf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded">{qf.team2Score}</span>
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
                    const isClickable = hasBoth && sf.status !== 'completed';
                    
                    return (
                      <div key={sfId} className="relative flex-1 flex flex-col justify-center max-h-[160px]">
                        <div className="text-[9px] font-mono text-[#a78bfa] mb-1 uppercase">4강 경기 {idx}</div>
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(sfId)}
                          className={`glass-panel p-3 rounded-xl border border-[#7c3aed]/40 transition-all flex flex-col gap-2 ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#a78bfa]/80 hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] active:scale-[0.98]' 
                              : 'opacity-85'
                          } ${sf.status === 'completed' ? 'border-success/30 bg-success/[0.01]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-xs py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${sf.winnerId === sf.team1Id ? 'text-primary' : 'text-slate-300'}`}>
                              {getTeamDisplayName(sfId, sf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded">{sf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs py-0.5">
                            <span className={`font-semibold truncate max-w-[150px] ${sf.winnerId === sf.team2Id ? 'text-primary' : 'text-slate-300'}`}>
                              {getTeamDisplayName(sfId, sf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/40 px-1.5 rounded">{sf.team2Score}</span>
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
                    const isClickable = hasBoth && gf.status !== 'completed';
                    
                    return (
                      <div className="relative flex flex-col justify-center animate-fade-in group">
                        <div className="absolute left-[-48px] top-1/2 w-[48px] border-b-2 border-hairline/40 pointer-events-none" />
                        <div 
                          onClick={() => isClickable && setSelectedMatchId(gfId)}
                          className={`glass-panel p-5 rounded-2xl border-2 border-[#f59e0b]/60 bg-gradient-to-br from-[#171109]/40 to-transparent transition-all flex flex-col gap-3 shadow-[0_0_30px_rgba(245,158,11,0.05)] ${
                            isClickable 
                              ? 'cursor-pointer hover:border-[#f59e0b] hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] active:scale-[0.98]' 
                              : 'opacity-90'
                          } ${gf.status === 'completed' ? 'border-success bg-success/5 shadow-[0_0_40px_rgba(16,185,129,0.15)]' : ''}`}
                        >
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className={`font-black truncate max-w-[180px] tracking-tight ${gf.winnerId === gf.team1Id ? 'text-[#f59e0b]' : 'text-slate-200'}`}>
                              {getTeamDisplayName(gfId, gf.team1Id, 1)}
                            </span>
                            <span className="font-mono bg-black/70 px-2.5 py-1 rounded-md border border-[#f59e0b]/20 min-w-[32px] text-center">{gf.team1Score}</span>
                          </div>
                          <div className="flex items-center justify-center opacity-30 select-none">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"></div>
                            <span className="px-3 text-[10px] font-black font-titular italic">VS</span>
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent"></div>
                          </div>
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className={`font-black truncate max-w-[180px] tracking-tight ${gf.winnerId === gf.team2Id ? 'text-[#f59e0b]' : 'text-slate-200'}`}>
                              {getTeamDisplayName(gfId, gf.team2Id, 2)}
                            </span>
                            <span className="font-mono bg-black/70 px-2.5 py-1 rounded-md border border-[#f59e0b]/20 min-w-[32px] text-center">{gf.team2Score}</span>
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
                      if (winnerId) {
                        return (
                          <div className="flex flex-col items-center animate-bounce-in">
                            <div className="relative group">
                              <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
                              <div className="relative glass-panel bg-gradient-to-b from-[#f59e0b]/20 to-[#1a1c22] border-2 border-[#f59e0b] p-8 rounded-[2.5rem] flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                                <div className="bg-gradient-to-tr from-[#f59e0b] to-yellow-200 p-4 rounded-full shadow-lg">
                                  <Medal className="w-10 h-10 text-[#140507]" />
                                </div>
                                <div className="text-center">
                                  <div className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">CHAMPION</div>
                                  <div className="text-2xl font-titular font-extrabold text-[#f59e0b] whitespace-nowrap drop-shadow-lg">
                                    {getTeamName(winnerId)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-8 flex gap-1">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-1 h-8 bg-gradient-to-b from-[#f59e0b]/40 to-transparent rounded-full"></div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="opacity-20 flex flex-col items-center gap-4 grayscale">
                          <div className="glass-panel border-2 border-hairline p-8 rounded-[2.5rem] flex flex-col items-center">
                             <Medal className="w-12 h-12 text-ink-tertiary mb-3" />
                             <span className="text-xs font-bold text-ink-tertiary uppercase tracking-tighter">아레나 대기 중</span>
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
        // Standard Elegant Tournament Layout
        <div className="flex-1 overflow-auto p-8 scrollbar-hidden">
          <div className="flex justify-start items-start min-w-max h-full gap-16 px-4 pb-24">
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
                    const isClickable = hasBothTeams && match.status !== 'completed';
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
                          className={`glass-panel overflow-hidden flex flex-col z-10 transition-all ${
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
                              ? 'bg-primary/15 text-white font-semibold' 
                              : match.winnerId && match.winnerId !== match.team1Id 
                                ? 'text-ink-tertiary line-through opacity-50' 
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
                              ? 'bg-primary/15 text-white font-semibold' 
                              : match.winnerId && match.winnerId !== match.team2Id 
                                ? 'text-ink-tertiary line-through opacity-50' 
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
        />
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
