import React, { useMemo } from 'react';
import { useTournament } from '../store';
import { 
  Users, 
  Trophy, 
  Activity, 
  Award, 
  TrendingUp, 
  Flame, 
  Target, 
  Crown,
  HeartCrack,
  Dribbble,
  Sparkles
} from 'lucide-react';

export const DashboardView = () => {
  const { state } = useTournament();
  
  // Memoize all statistics to prevent expensive re-computation on every render
  const stats = useMemo(() => {
    // Cache entities and initialize statistics
    const playerStats: Record<string, { id: string; name: string; teamId: string; teamName: string; wins: number; losses: number; played: number; characters: Set<string> }> = {};
    const charStats: Record<string, { picks: number; wins: number; losses: number }> = {};
    const teamStats: Record<string, { id: string; name: string; matchWins: number; matchLosses: number; matchPlayed: number; setWins: number; setLosses: number; characters: Set<string> }> = {};

    state.teams.forEach(t => {
      teamStats[t.id] = {
        id: t.id,
        name: t.name,
        matchWins: 0,
        matchLosses: 0,
        matchPlayed: 0,
        setWins: 0,
        setLosses: 0,
        characters: new Set()
      };

      t.players.forEach(p => {
        playerStats[p.id] = {
          id: p.id,
          name: p.name,
          teamId: t.id,
          teamName: t.name,
          wins: 0,
          losses: 0,
          played: 0,
          characters: new Set()
        };
      });
    });

    let totalSetsCount = 0;

    // Traverse matches and records
    state.matches.forEach(m => {
      if (m.status === 'completed' && m.winnerId) {
        if (teamStats[m.team1Id!]) {
          teamStats[m.team1Id!].matchPlayed++;
          if (m.winnerId === m.team1Id) teamStats[m.team1Id!].matchWins++;
          else teamStats[m.team1Id!].matchLosses++;
        }
        if (teamStats[m.team2Id!]) {
          teamStats[m.team2Id!].matchPlayed++;
          if (m.winnerId === m.team2Id) teamStats[m.team2Id!].matchWins++;
          else teamStats[m.team2Id!].matchLosses++;
        }
      }

      m.sets.forEach(s => {
        if (s.winnerTeamId) {
          totalSetsCount++;
          const t1Wins = s.winnerTeamId === m.team1Id;

          if (m.team1Id && teamStats[m.team1Id]) {
            if (t1Wins) teamStats[m.team1Id].setWins++;
            else teamStats[m.team1Id].setLosses++;
          }
          if (m.team2Id && teamStats[m.team2Id]) {
            if (!t1Wins) teamStats[m.team2Id].setWins++;
            else teamStats[m.team2Id].setLosses++;
          }

          if (s.team1PlayerId && playerStats[s.team1PlayerId]) {
            playerStats[s.team1PlayerId].played++;
            if (t1Wins) playerStats[s.team1PlayerId].wins++;
            else playerStats[s.team1PlayerId].losses++;
            if (s.team1Character) {
              playerStats[s.team1PlayerId].characters.add(s.team1Character);
              if (m.team1Id && teamStats[m.team1Id]) teamStats[m.team1Id].characters.add(s.team1Character);
            }
          }

          if (s.team2PlayerId && playerStats[s.team2PlayerId]) {
            playerStats[s.team2PlayerId].played++;
            if (!t1Wins) playerStats[s.team2PlayerId].wins++;
            else playerStats[s.team2PlayerId].losses++;
            if (s.team2Character) {
              playerStats[s.team2PlayerId].characters.add(s.team2Character);
              if (m.team2Id && teamStats[m.team2Id]) teamStats[m.team2Id].characters.add(s.team2Character);
            }
          }

          if (s.team1Character) {
            const char = s.team1Character;
            if (!charStats[char]) charStats[char] = { picks: 0, wins: 0, losses: 0 };
            charStats[char].picks++;
            if (t1Wins) charStats[char].wins++;
            else charStats[char].losses++;
          }

          if (s.team2Character) {
            const char = s.team2Character;
            if (!charStats[char]) charStats[char] = { picks: 0, wins: 0, losses: 0 };
            charStats[char].picks++;
            if (!t1Wins) charStats[char].wins++;
            else charStats[char].losses++;
          }
        }
      });
    });

    const playerList = Object.values(playerStats);
    const charList = Object.entries(charStats).map(([name, stat]) => ({ name, ...stat }));
    const teamList = Object.values(teamStats);

    const maxCharTeam = teamList.length > 0 ? [...teamList].sort((a,b) => b.characters.size - a.characters.size)[0] : null;
    const maxCharPlayer = playerList.length > 0 ? [...playerList].sort((a,b) => b.characters.size - a.characters.size)[0] : null;

    const topWinPlayer = playerList.length > 0 && playerList.some(p => p.wins > 0) ? [...playerList].sort((a,b) => b.wins - a.wins)[0] : null;
    const highestRatePlayer = playerList.length > 0 && playerList.some(p => p.played >= 2 && p.wins > 0) ? [...playerList].filter(p => p.played >= 2).sort((a,b) => (b.wins/b.played) - (a.wins/a.played))[0] : null;
    const qfMatches = state.matches.filter(m => m.id.startsWith('QF_'));
    const top8TeamIds = new Set<string>();
    qfMatches.forEach(m => {
      if (m.team1Id) top8TeamIds.add(m.team1Id);
      if (m.team2Id) top8TeamIds.add(m.team2Id);
    });

    const busKingPlayer = playerList.length > 0 && playerList.some(p => top8TeamIds.has(p.teamId) && p.played > 0) ? [...playerList].filter(p => top8TeamIds.has(p.teamId) && p.played > 0).sort((a,b) => (a.wins/a.played) - (b.wins/b.played) || b.losses - a.losses)[0] : null;
    const top3PickChars = charList.length > 0 
      ? [...charList]
          .sort((a,b) => b.picks - a.picks || b.wins - a.wins)
          .slice(0, 3)
      : [];
    
    // Calculate Top 3 Highest Win Rate Characters (at least 1 pick)
    const top3WinChars = charList.length > 0 
      ? [...charList]
          .filter(c => c.picks >= 1)
          .sort((a,b) => (b.wins/b.picks) - (a.wins/a.picks) || b.picks - a.picks)
          .slice(0, 3)
      : [];

    // Calculate Top 3 Lowest Win Rate Characters (at least 1 pick)
    const top3LossChars = charList.length > 0 
      ? [...charList]
          .filter(c => c.picks >= 1)
          .sort((a,b) => (a.wins/a.picks) - (b.wins/b.picks) || a.picks - b.picks)
          .slice(0, 3)
      : [];

    const highestWinRateTeam = teamList.length > 0 && teamList.some(t => t.matchPlayed > 0) 
      ? [...teamList].filter(t => t.matchPlayed > 0).sort((a,b) => {
          const rateA = a.matchWins / a.matchPlayed;
          const rateB = b.matchWins / b.matchPlayed;
          if (rateB !== rateA) return rateB - rateA;
          return (b.matchWins - a.matchWins) || (b.setWins - a.setWins);
        })[0] 
      : null;

    const finalMatch = state.matches.find(m => m.id === 'GF_1') || [...state.matches].sort((a,b) => b.round - a.round)[0];
    const tournamentWinner = (finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId) ? state.teams.find(t => t.id === finalMatch.winnerId) : null;
    const completedMatches = state.matches.filter(m => m.status === 'completed').length;

    return {
      maxCharTeam, maxCharPlayer, topWinPlayer, highestRatePlayer, busKingPlayer,
      top3PickChars, top3WinChars, top3LossChars, highestWinRateTeam, tournamentWinner,
      totalMatches: state.matches.length, completedMatches, totalSetsCount
    };
  }, [state.teams, state.matches]);

  // Memoize fire particles to prevent recreation (flowing smoothly left to right)
  const winnerParticles = useMemo(() => {
    const colors = ['bg-primary', 'bg-yellow-300', 'bg-white', 'bg-orange-400'];
    return [...Array(22)].map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 0.6 + Math.random() * 1.6,
      left: `${-20 - Math.random() * 20}%`, // Start off-screen left
      top: `${Math.random() * 100}%`,
      duration: `${4.5 + Math.random() * 5.5}s`,
      delay: `${Math.random() * 7}s`,
      driftY: -40 - Math.random() * 60
    }));
  }, []);

  const {
    maxCharTeam, maxCharPlayer, topWinPlayer, highestRatePlayer, busKingPlayer,
    top3PickChars, top3WinChars, top3LossChars, highestWinRateTeam, tournamentWinner,
    totalMatches, completedMatches, totalSetsCount
  } = stats;

  return (
    <div className="p-8 h-full overflow-y-auto scrollbar-hidden translate-z-0 will-change-transform">
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-titular text-ink mb-1 font-bold">전투 관제소</h1>
          <p className="text-ink-subtle text-xs">매 세트 기록에 기반한 실시간 지표 분석과 챔피언십 랭킹</p>
        </div>
        <div className="flex items-center gap-2 bg-[#14181c] border border-hairline/60 rounded-lg px-4 py-2">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping"></span>
          <span className="text-white text-xs font-semibold leading-none">실시간 연산 중</span>
        </div>
      </header>

      {/* Main progress indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-hairline/40">
          <div>
            <p className="text-ink-subtle text-xs mb-1 font-medium select-none">참가 팀 수</p>
            <p className="text-2xl font-titular text-white font-extrabold">{state.settings.numTeams}<span className="text-sm font-sans text-ink-tertiary ml-1">팀</span></p>
          </div>
          <div className="w-10 h-10 bg-[#161a20] rounded-full flex items-center justify-center border border-hairline/60">
            <Users className="text-[#a0a5ad] w-5 h-5" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-hairline/40">
          <div>
            <p className="text-ink-subtle text-xs mb-1 font-medium select-none">대회 진행률</p>
            <p className="text-2xl font-titular text-white font-extrabold">
              {totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0}
              <span className="text-sm font-sans text-ink-tertiary ml-1">%</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-[#161a20] rounded-full flex items-center justify-center border border-hairline/60">
            <Activity className="text-primary w-5 h-5" />
          </div>
        </div>
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between border border-hairline/40">
          <div>
            <p className="text-ink-subtle text-xs mb-1 font-medium select-none">누적 완료 매치</p>
            <p className="text-2xl font-titular text-white font-extrabold">
              {completedMatches} <span className="text-xs font-sans text-ink-tertiary font-normal">/ {totalMatches} 경기</span>
            </p>
          </div>
          <div className="w-10 h-10 bg-[#161a20] rounded-full flex items-center justify-center border border-hairline/60">
            <Trophy className="text-[#e2b028] w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Row 1: Team KPI Cards */}
      <h2 className="text-sm font-titular text-ink-subtle font-bold tracking-[0.2em] uppercase mb-4 mt-2 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#f59e0b]" /> TEAM CHAMPIONSHIP INSIGHTS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Championship Winner Card */}
        <div className="glass-panel p-6 rounded-2xl border-2 border-primary/60 shadow-[0_0_25px_rgba(225,29,72,0.25)] bg-gradient-to-br from-[#2a080e] via-[#0c0f12] to-[#0c0f12] flex flex-col justify-between relative overflow-hidden h-48">
          {/* Intense Base Red Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 animate-flame-flow bg-gradient-to-br from-primary/40 via-primary/5 to-transparent"></div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/25 rounded-full blur-3xl -mr-10 -mt-10"></div>
          
          {/* Winner Card Fire Particles - More intense and wider range */}
          <div className="absolute -inset-8 z-0 pointer-events-none overflow-hidden opacity-85">
            {winnerParticles.map((p) => (
              <div 
                key={p.id}
                className={`absolute rounded-full blur-[0.7px] animate-fire-right-flow ${p.color}`}
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

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-primary/25 text-primary border border-primary/40 rounded shadow-[0_0_8px_rgba(225,29,72,0.2)]">Arena Champion</span>
                <Crown className="w-5 h-5 text-[#f59e0b] animate-bounce" />
              </div>
              <p className="text-ink-tertiary text-[10px] mb-1 font-bold uppercase tracking-tighter">최종 우승팀</p>
              {tournamentWinner ? (
                <h3 className="text-xl font-titular text-white font-black drop-shadow-md">{tournamentWinner.name}</h3>
              ) : (
                <h3 className="text-lg font-titular text-white/40 font-bold">집계 중...</h3>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px]">
              {tournamentWinner ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 대회를 제패하였습니다
                </span>
              ) : (
                <span className="text-primary/70 font-semibold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  결승전 경기 진행 대기 중
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Highest Win Rate Team Card */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">Performance</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-ink-tertiary text-[10px] mb-1 font-bold uppercase tracking-tighter">최고 승률 팀</p>
            {highestWinRateTeam ? (
              <h3 className="text-xl font-titular text-white font-black">{highestWinRateTeam.name}</h3>
            ) : (
              <h3 className="text-lg font-titular text-white/40 font-bold">데이터 부족</h3>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-subtle">매치 승률</span>
              <span className="text-lg font-mono font-black text-blue-400 tracking-tighter leading-none">
                {highestWinRateTeam && highestWinRateTeam.matchPlayed > 0 ? Math.round((highestWinRateTeam.matchWins / highestWinRateTeam.matchPlayed) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-[10px] font-mono font-bold text-blue-400/60 leading-none">
                ({highestWinRateTeam && (highestWinRateTeam.setWins + highestWinRateTeam.setLosses) > 0 
                  ? Math.round((highestWinRateTeam.setWins / (highestWinRateTeam.setWins + highestWinRateTeam.setLosses)) * 100) 
                  : 0}% 세트 승률)
              </span>
            </div>
          </div>
        </div>

        {/* Most Diverse Team Card */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48 group relative cursor-help hover:border-purple-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded">Strategy</span>
              <Dribbble className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-ink-tertiary text-[10px] mb-1 font-bold uppercase tracking-tighter">최다 챔피언 기용 팀</p>
            {maxCharTeam && maxCharTeam.characters.size > 0 ? (
              <h3 className="text-xl font-titular text-white font-black truncate max-w-[170px]">{maxCharTeam.name}</h3>
            ) : (
              <h3 className="text-lg font-titular text-white/40 font-bold">분석 중...</h3>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink-subtle">고유 챔피언 수</span>
            <span className="text-lg font-mono font-black text-purple-400 tracking-tighter">
              {maxCharTeam ? maxCharTeam.characters.size : 0}종
            </span>
          </div>

          {/* Elegant Rollover Champion Pop-over Tooltip */}
          {maxCharTeam && maxCharTeam.characters.size > 0 && (
            <div className="absolute bottom-[92%] left-1/2 -translate-x-1/2 w-56 bg-[#0c0e12] border-2 border-purple-500/40 p-3 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50 pointer-events-none">
              <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-1.5 border-b border-hairline/20 pb-1 flex items-center justify-between">
                <span>기용 챔피언 목록</span>
                <span className="text-[9px] text-zinc-500">{maxCharTeam.characters.size}종</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto no-scrollbar">
                {Array.from(maxCharTeam.characters).map(c => (
                  <span key={c} className="px-1.5 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/30 rounded text-[9px] font-black leading-none">{c}</span>
                ))}
              </div>
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#0c0e12] border-r-2 border-b-2 border-purple-500/40 rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Player KPI Cards */}
      <h2 className="text-sm font-titular text-ink-subtle font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> PLAYER TELEMETRY DATA
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* Most Wins Player */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48 group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-mono text-primary font-black tracking-tighter">최다 승리</span>
          </div>
          <div className="mt-4">
            {topWinPlayer ? (
              <>
                <h4 className="text-lg font-titular text-white font-black leading-tight truncate">{topWinPlayer.name}</h4>
                <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter">{topWinPlayer.teamName}</p>
              </>
            ) : (
              <h4 className="text-lg font-titular text-white/30 font-bold">기록 대기 중</h4>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-ink-tertiary">세트 승리</span>
            <span className="text-sm font-mono font-black text-primary">{topWinPlayer?.wins || 0}승</span>
          </div>
        </div>

        {/* Highest Win Rate Player */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48 group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[10px] font-mono text-blue-400 font-black tracking-tighter">최고 승률</span>
          </div>
          <div className="mt-4">
            {highestRatePlayer ? (
              <>
                <h4 className="text-lg font-titular text-white font-black leading-tight truncate">{highestRatePlayer.name}</h4>
                <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter">{highestRatePlayer.teamName}</p>
              </>
            ) : (
              <h4 className="text-lg font-titular text-white/30 font-bold">최소 2전 필요</h4>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-ink-tertiary">세트 승률</span>
            <span className="text-sm font-mono font-black text-blue-400">
              {highestRatePlayer ? Math.round((highestRatePlayer.wins / highestRatePlayer.played) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Most Diverse Player */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48 group relative cursor-help hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-black tracking-tighter">다양한 챔피언</span>
          </div>
          <div className="mt-4">
            {maxCharPlayer && maxCharPlayer.characters.size > 0 ? (
              <>
                <h4 className="text-lg font-titular text-white font-black leading-tight truncate">{maxCharPlayer.name}</h4>
                <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter truncate">{maxCharPlayer.teamName}</p>
              </>
            ) : (
              <h4 className="text-lg font-titular text-white/30 font-bold">분석 중...</h4>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-ink-tertiary">캐릭터 풀</span>
            <span className="text-sm font-mono font-black text-purple-400">{maxCharPlayer?.characters.size || 0}종</span>
          </div>

          {/* Elegant Rollover Champion Pop-over Tooltip */}
          {maxCharPlayer && maxCharPlayer.characters.size > 0 && (
            <div className="absolute bottom-[92%] left-1/2 -translate-x-1/2 w-56 bg-[#0c0e12] border-2 border-purple-500/40 p-3 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-250 z-50 pointer-events-none">
              <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest mb-1.5 border-b border-hairline/20 pb-1 flex items-center justify-between">
                <span>기용 챔피언 목록</span>
                <span className="text-[9px] text-zinc-500">{maxCharPlayer.characters.size}종</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto no-scrollbar">
                {Array.from(maxCharPlayer.characters).map(c => (
                  <span key={c} className="px-1.5 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/30 rounded text-[9px] font-black leading-none">{c}</span>
                ))}
              </div>
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#0c0e12] border-r-2 border-b-2 border-purple-500/40 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Bus King (Lowest Win Rate among Top 8) */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between h-48 group hover:border-orange-400/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
              <HeartCrack className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-orange-400 font-black tracking-tighter">버스왕</div>
              <div className="text-[8px] text-orange-400/60 font-bold tracking-tight uppercase leading-none">(8강 이상 최저승률)</div>
            </div>
          </div>
          <div className="mt-4">
            {busKingPlayer ? (
              <>
                <h4 className="text-lg font-titular text-white font-black leading-tight truncate">{busKingPlayer.name}</h4>
                <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter leading-none">{busKingPlayer.teamName}</p>
              </>
            ) : (
              <h4 className="text-lg font-titular text-white/30 font-bold">기록 없음</h4>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline/30 flex items-center justify-between">
            <span className="text-[10px] font-bold text-ink-tertiary">세트 승률</span>
            <span className="text-sm font-mono font-black text-orange-400">
              {busKingPlayer ? Math.round((busKingPlayer.wins / busKingPlayer.played) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Fighter Character Meta Report */}
      <h2 className="text-sm font-titular text-ink-subtle font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" /> FIGHTER META ANALYSIS
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Most Picked Characters TOP 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/40 bg-[#0d1013] flex flex-col h-48">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest leading-none mb-1">POPULARITY MEASURE</p>
              <h4 className="text-sm font-bold text-white">PICK TOP 3</h4>
            </div>
            <Flame className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {top3PickChars.length > 0 ? top3PickChars.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-black ${idx === 0 ? 'bg-primary text-white' : 'bg-white/10 text-ink-subtle'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-ink truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-xs font-mono font-black text-primary">{c.picks}회</span>
              </div>
            )) : (
              <p className="text-[10px] text-ink-tertiary text-center italic py-2">기록 대기 중</p>
            )}
          </div>
        </div>

        {/* Highest Win Rate Characters TOP 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/40 bg-[#0d1013] flex flex-col h-48">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest leading-none mb-1">WINNING POTENTIAL</p>
              <h4 className="text-sm font-bold text-white">승률 최고 TOP 3</h4>
            </div>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {top3WinChars.length > 0 ? top3WinChars.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-black ${idx === 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-ink-subtle'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-ink truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400">{Math.round((c.wins / c.picks) * 100)}%</span>
              </div>
            )) : (
              <p className="text-[10px] text-ink-tertiary text-center italic py-2">기록 대기 중</p>
            )}
          </div>
        </div>

        {/* Lowest Win Rate Characters TOP 3 */}
        <div className="glass-panel p-6 rounded-2xl border border-hairline/40 bg-[#0d1013] flex flex-col h-48">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest leading-none mb-1">STRUGGLING META</p>
              <h4 className="text-sm font-bold text-white">승률 최하 TOP 3</h4>
            </div>
            <HeartCrack className="w-4 h-4 text-rose-500" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {top3LossChars.length > 0 ? top3LossChars.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-black ${idx === 0 ? 'bg-rose-500 text-white' : 'bg-white/10 text-ink-subtle'}`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-ink truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-xs font-mono font-black text-rose-500">{Math.round((c.wins / c.picks) * 100)}%</span>
              </div>
            )) : (
              <p className="text-[10px] text-ink-tertiary text-center italic py-2">기록 대기 중</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

