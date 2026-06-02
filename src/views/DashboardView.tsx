import React from 'react';
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
  
  // Cache entities and initialize statistics
  const playerStats: Record<string, { id: string; name: string; teamName: string; wins: number; losses: number; played: number; characters: Set<string> }> = {};
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

  // Diverse fighters (Team, Player)
  const maxCharTeam = teamList.length > 0 ? [...teamList].sort((a,b) => b.characters.size - a.characters.size)[0] : null;
  const maxCharPlayer = playerList.length > 0 ? [...playerList].sort((a,b) => b.characters.size - a.characters.size)[0] : null;

  // Player metrics
  const topWinPlayer = playerList.length > 0 && playerList.some(p => p.wins > 0)
    ? [...playerList].sort((a,b) => b.wins - a.wins)[0] 
    : null;
  const highestRatePlayer = playerList.length > 0 && playerList.some(p => p.played >= 2 && p.wins > 0)
    ? [...playerList].filter(p => p.played >= 2).sort((a,b) => (b.wins/b.played) - (a.wins/a.played))[0] 
    : null;
  const mostLossesPlayer = playerList.length > 0 && playerList.some(p => p.losses > 0)
    ? [...playerList].sort((a,b) => b.losses - a.losses)[0] 
    : null;

  // Character metrics
  const topPickChar = charList.length > 0 ? [...charList].sort((a,b) => b.picks - a.picks)[0] : null;
  const topWinChar = charList.length > 0 && charList.some(c => c.wins > 0)
    ? [...charList].filter(c => c.picks >= 1).sort((a,b) => (b.wins/b.picks) - (a.wins/a.picks))[0] 
    : null;
  const topLossChar = charList.length > 0 && charList.some(c => c.losses > 0)
    ? [...charList].filter(c => c.picks >= 1).sort((a,b) => (b.losses/b.picks) - (a.losses/a.picks))[0] 
    : null;

  // Winning Teams
  const highestWinRateTeam = teamList.length > 0 && teamList.some(t => t.matchPlayed > 0)
    ? [...teamList].filter(t => t.matchPlayed > 0).sort((a,b) => (b.matchWins/b.matchPlayed) - (a.matchWins/a.matchPlayed))[0] 
    : null;

  const finalMatch = state.matches.find(m => m.id === 'GF_1') || [...state.matches].sort((a,b) => b.round - a.round)[0];
  const tournamentWinner = (finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId) 
    ? state.teams.find(t => t.id === finalMatch.winnerId) 
    : null;

  const totalMatches = state.matches.length;
  const completedMatches = state.matches.filter(m => m.status === 'completed').length;

  return (
    <div className="p-8 h-full overflow-y-auto scrollbar-hidden">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8" id="dashboard_summary_panel">
        
        {/* Championship Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-hairline/80 bg-gradient-to-br from-[#1c0f12] via-[#0c0f12] to-[#0c0f12] flex flex-col justify-between relative overflow-hidden" id="card_championship">
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest bg-primary/20 text-primary border border-primary/30 rounded">Championship</span>
                <Crown className="w-6 h-6 text-[#f59e0b]" />
              </div>
              
              <p className="text-ink-subtle text-xs mb-1 font-medium">최종 우승팀</p>
              {tournamentWinner ? (
                <div>
                  <h3 className="text-2xl font-titular text-white font-black drop-shadow-md mb-2">{tournamentWinner.name}</h3>
                  <p className="text-xs text-primary/80 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 대회를 제패하고 정상에 올랐습니다
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-titular text-white/50 font-semibold mb-2">승부 예측 진행 중</h3>
                  {highestWinRateTeam ? (
                    <p className="text-xs text-ink-subtle leading-relaxed">
                      현재 최고 승률 팀: <span className="text-white font-bold">{highestWinRateTeam.name}</span>
                      <span className="text-primary font-bold ml-1">
                        ({highestWinRateTeam.matchPlayed > 0 ? Math.round((highestWinRateTeam.matchWins / highestWinRateTeam.matchPlayed) * 100) : 0}%)
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-ink-tertiary">아직 매치가 치러지지 않았습니다.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-hairline/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-ink-tertiary block font-mono">CHAMPIONSHIP CUP</span>
                <span className="text-xs text-white font-bold">우승 트로피 대기 중</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-hairline/60">
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
              </div>
            </div>
          </div>

          {/* Diverse Hero Pool Card */}
          <div className="glass-panel p-6 rounded-2xl border border-hairline/60 flex flex-col justify-between" id="card_diverse">
            <h3 className="text-sm font-titular text-white font-bold mb-4 flex items-center gap-2">
              <Dribbble className="w-4 h-4 text-purple-400" /> 다양한 챔피언 플레이
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-ink-subtle font-semibold block uppercase tracking-wider mb-1">최다 고유 챔피언 기용 팀</p>
                {maxCharTeam && maxCharTeam.characters.size > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-bold">{maxCharTeam.name}</span>
                    <span className="text-xs text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {maxCharTeam.characters.size}종 기용
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-tertiary">시작 대기 중</p>
                )}
              </div>

              <div className="border-t border-hairline/40 pt-3">
                <p className="text-[10px] text-ink-subtle font-semibold block uppercase tracking-wider mb-1">최다 고유 챔피언 기용 선수</p>
                {maxCharPlayer && maxCharPlayer.characters.size > 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white font-bold block leading-tight">{maxCharPlayer.name}</span>
                      <span className="text-[10px] text-ink-tertiary">{maxCharPlayer.teamName}</span>
                    </div>
                    <span className="text-xs text-purple-400 font-mono font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {maxCharPlayer.characters.size}종 기용
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-tertiary">시작 대기 중</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Players Telemetry */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard_players_telemetry">
          
          {/* Best Slayer Card */}
          <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between" id="card_slayer">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#1a0f11] border border-primary/20 flex items-center justify-center mb-4">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-xs text-ink-subtle font-bold tracking-widest uppercase mb-1">최다 승리 슬레이어</h4>
              <p className="text-[10px] text-ink-tertiary mb-4 leading-none">대회에서 가장 세트를 많이 딴 플레이어</p>
              
              {topWinPlayer ? (
                <div className="mt-2">
                  <p className="text-xl font-titular text-white font-black">{topWinPlayer.name}</p>
                  <p className="text-[11px] text-ink-subtle font-semibold leading-relaxed">{topWinPlayer.teamName}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-tertiary mt-2">치러진 세트가 없습니다</p>
              )}
            </div>

            {topWinPlayer && (
              <div className="mt-6 pt-4 border-t border-hairline/40 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-ink-tertiary block font-mono">RECORD</span>
                  <span className="text-xs text-white font-bold font-mono">{topWinPlayer.wins}승 {topWinPlayer.losses}패</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink-tertiary block font-mono">SECTOR</span>
                  <span className="text-xs text-primary font-bold font-mono">{topWinPlayer.played}세트 진행</span>
                </div>
              </div>
            )}
          </div>

          {/* Highest Win Rate Player */}
          <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between" id="card_god">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#0e161c] border border-[rgba(59,130,246,0.2)] flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-xs text-ink-subtle font-bold tracking-widest uppercase mb-1" id="label_tactician">지략 전술 최고 승률</h4>
              <p className="text-[10px] text-ink-tertiary mb-4 leading-none">핵심 세력 중 가장 치명적인 극강 승률(최소 2세트)</p>
              
              {highestRatePlayer ? (
                <div className="mt-2">
                  <p className="text-xl font-titular text-white font-black">{highestRatePlayer.name}</p>
                  <p className="text-[11px] text-ink-subtle font-semibold leading-relaxed">{highestRatePlayer.teamName}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-tertiary mt-2">준비 중 (최소 2세트 진행 시 출현)</p>
              )}
            </div>

            {highestRatePlayer && (
              <div className="mt-6 pt-4 border-t border-hairline/40 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-ink-tertiary block font-mono">WIN RATE</span>
                  <span className="text-xs text-white font-bold font-mono">{Math.round((highestRatePlayer.wins / highestRatePlayer.played) * 100)}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink-tertiary block font-mono">COMBAT</span>
                  <span className="text-xs text-blue-400 font-bold font-mono">{highestRatePlayer.wins}승 / {highestRatePlayer.played}전</span>
                </div>
              </div>
            )}
          </div>

          {/* Most Losses Player (The Sorrowful) */}
          <div className="glass-panel p-6 rounded-2xl border border-hairline/60 bg-[#0d1013] flex flex-col justify-between" id="card_sorrow">
            <div>
              <div className="w-9 h-9 rounded-lg bg-[#141215] border border-orange-500/10 flex items-center justify-center mb-4">
                <HeartCrack className="w-5 h-5 text-orange-400" />
              </div>
              <h4 className="text-xs text-ink-subtle font-bold tracking-widest uppercase mb-1" id="label_challenger">눈물 흘린 도전자</h4>
              <p className="text-[10px] text-ink-tertiary mb-4 leading-none">이번 대회에서 가장 패배의 아픔을 많이 겪은 전사</p>
              
              {mostLossesPlayer ? (
                <div className="mt-2">
                  <p className="text-xl font-titular text-white font-black">{mostLossesPlayer.name}</p>
                  <p className="text-[11px] text-ink-subtle font-semibold leading-relaxed">{mostLossesPlayer.teamName}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-tertiary mt-2">치러진 패배가 기록되지 않았습니다</p>
              )}
            </div>

            {mostLossesPlayer && (
              <div className="mt-6 pt-4 border-t border-hairline/40 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-ink-tertiary block font-mono">LOSSES</span>
                  <span className="text-xs text-white font-bold font-mono">{mostLossesPlayer.losses}패</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ink-tertiary block font-mono">COURAGE</span>
                  <span className="text-xs text-orange-400 font-bold font-mono">{mostLossesPlayer.played}선 플레이</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Fighters Analysis Grid */}
      <h2 className="text-xl font-titular text-white font-extrabold mb-5 mt-8 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" /> 파이터 캐릭터 메타 리포터
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="dashboard_character_metadata">
        {/* Most Picked Character */}
        <div className="glass-panel p-5 rounded-2xl border border-hairline/50" id="card_meta_pick">
          <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest mb-1">MOST SELECTED HERO</p>
          <h4 className="text-sm font-bold text-white mb-4">가장 선호하는 격투 강자</h4>
          
          {topPickChar ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-titular text-white font-black">{topPickChar.name}</span>
                <span className="text-xs text-ink-tertiary block font-mono mt-0.5">선택 메타의 주력 핵심</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-titular text-primary font-black font-mono">{topPickChar.picks}회</span>
                <span className="text-[10px] text-ink-subtle block font-mono">기용 비율 {totalSetsCount > 0 ? Math.round((topPickChar.picks / (totalSetsCount * 2)) * 100) : 0}%</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-tertiary py-2">격투 경기 진행 이력 대기 중</p>
          )}
        </div>

        {/* Highest Win Rate Character */}
        <div className="glass-panel p-5 rounded-2xl border border-hairline/50" id="card_meta_win">
          <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest mb-1">HIGHEST WIN RATE HERO</p>
          <h4 className="text-sm font-bold text-white mb-4">메타상 최고의 극강 승률 캐릭터</h4>
          
          {topWinChar ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-titular text-white font-black">{topWinChar.name}</span>
                <span className="text-xs text-ink-tertiary block font-mono mt-0.5">{topWinChar.wins}승 {topWinChar.losses}패 기록</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-titular text-emerald-400 font-black font-mono">
                  {Math.round((topWinChar.wins / topWinChar.picks) * 100)}%
                </span>
                <span className="text-[10px] text-ink-subtle block font-mono">총 {topWinChar.picks}회 출격</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-tertiary py-2">격투 경기 완료 이력 대기 중</p>
          )}
        </div>

        {/* Highest Loss Rate Character */}
        <div className="glass-panel p-5 rounded-2xl border border-hairline/50" id="card_meta_loss">
          <p className="text-[10px] text-ink-tertiary uppercase font-mono tracking-widest mb-1">HIGHEST LOSS RATE HERO</p>
          <h4 className="text-sm font-bold text-white mb-4 font-normal">패배율이 가장 높은 방전 캐릭터</h4>
          
          {topLossChar ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-titular text-white font-black">{topLossChar.name}</span>
                <span className="text-xs text-ink-tertiary block font-mono mt-0.5">{topLossChar.losses}패 {topLossChar.wins}승 기록</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-titular text-orange-400 font-black font-mono">
                  {Math.round((topLossChar.losses / topLossChar.picks) * 100)}%
                </span>
                <span className="text-[10px] text-ink-subtle block font-mono">총 {topLossChar.picks}회 출격</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-tertiary py-2">격투 경기 완료 이력 대기 중</p>
          )}
        </div>
      </div>
    </div>
  );
};

