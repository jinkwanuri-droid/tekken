import { createContext, useContext, useReducer, useEffect, useRef, ReactNode, Dispatch } from 'react';
import { TournamentState, Team, MatchItem, TournamentSettings, Player, MatchStatus } from './types';

// Helper to generate UUIDs simply
const uuid = () => Math.random().toString(36).substring(2, 9);

const predefinedTeams = [
  { name: '버컴퍼니', players: ['감스트', '유설아', '망구랑', '해리', '유연서', '니니'] },
  { name: '홍신소', players: ['홍타쿠', '잠결', '따스히', '고채린', '모야', '아눙'] },
  { name: '지력사무소', players: ['지피티', '라무', '모나양', '싱유', '김병살', '한아련'] },
  { name: '가무소', players: ['가습기', '쨈도은', '하루아이', '잼율이', '기찬하', '단수아'] },
  { name: '꾸한성', players: ['꾸티뉴', '야무지', '엔쥬', '란다', '셀키', '리카'] },
  { name: '버블란', players: ['박재박', '쩜냥이', '예요예요', '다시바', '슈니', '공태연'] },
  { name: '고래상사', players: ['울산큰고래', '멜로딩딩', '김마렌', '삐요코', '견자희', '쏭이'] },
  { name: '뚱딴지', players: ['아뚱', '유키', '꼼모리', '니니밍', '호미밍', '피치'] },
  { name: '로스타시티', players: ['로기다', '추멘', '은초롱', '온유일', '이투', '리피피'] },
  { name: '버인협회', players: ['조경훈', '해솔', '송소미', '비숑', '뀨복', '표우'] },
  { name: '어인섬', players: ['뿌꾸', '라거머핀', '차쯔키', '하나나', '설레랑', '차밍챠'] }
];

export const computeGroupStandings = (teams: Team[], matches: MatchItem[], group: 'A' | 'B' | 'C') => {
  const groupMatchItems = matches.filter(m => m.isGroupStage && m.groupName === group);
  const teamIds = Array.from(new Set(
    groupMatchItems.flatMap(m => [m.team1Id, m.team2Id]).filter((id): id is string => id !== null)
  ));

  const standings = teamIds.map(tId => {
    const team = teams.find(t => t.id === tId)!;
    let played = 0;
    let won = 0;
    let lost = 0;
    let setsWon = 0;
    let setsLost = 0;

    groupMatchItems.forEach(m => {
      if (m.team1Id === tId || m.team2Id === tId) {
        const isTeam1 = m.team1Id === tId;
        const myScore = isTeam1 ? m.team1Score : m.team2Score;
        const oppScore = isTeam1 ? m.team2Score : m.team1Score;
        
        setsWon += myScore;
        setsLost += oppScore;

        if (m.status === 'completed') {
          played++;
          if (m.winnerId === tId) {
            won++;
          } else {
            lost++;
          }
        }
      }
    });

    return {
      teamId: tId,
      teamName: team ? team.name : `Team ${tId}`,
      team,
      played,
      won,
      lost,
      setsWon,
      setsLost,
      setDiff: setsWon - setsLost
    };
  });

  // Sort: Matches Won -> Set Diff (득실차) -> Head-to-Head (승자승) -> Sets Won -> Alphabetical
  standings.sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won;
    if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
    
    // 승자승 법칙 (Head-to-head)
    const h2hMatch = groupMatchItems.find(m => 
      m.status === 'completed' && 
      ((m.team1Id === a.teamId && m.team2Id === b.teamId) || 
       (m.team1Id === b.teamId && m.team2Id === a.teamId))
    );
    if (h2hMatch && h2hMatch.winnerId) {
      if (h2hMatch.winnerId === b.teamId) return 1;
      if (h2hMatch.winnerId === a.teamId) return -1;
    }

    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    return a.teamName.localeCompare(b.teamName);
  });

  return standings;
};

interface GroupStandingInfo {
  teamId: string;
  teamName: string;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
}

export const getDeterministicBracketPlacements = (teams: Team[], matches: MatchItem[]) => {
  const groups: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
  const placements: {
    A: { 1: string | null; 2: string | null; 3: string | null };
    B: { 1: string | null; 2: string | null; 3: string | null };
    C: { 1: string | null; 2: string | null; 3: string | null };
  } = {
    A: { 1: null, 2: null, 3: null },
    B: { 1: null, 2: null, 3: null },
    C: { 1: null, 2: null, 3: null },
  };

  // 1. 각 조별 가능한 최종 시나리오 성적 시뮬레이션
  const groupScenarios: Record<'A' | 'B' | 'C', GroupStandingInfo[][]> = {
    A: [],
    B: [],
    C: [],
  };

  for (const group of groups) {
    const groupMatches = matches.filter(m => m.isGroupStage && m.groupName === group);
    const uncompleted = groupMatches.filter(m => m.status !== 'completed');

    // 미완료 경기가 7경기 이상이면 완전 탐색은 무리이므로 현재 상태로 대체
    if (uncompleted.length > 6) {
      const currentStandings = computeGroupStandings(teams, matches, group);
      groupScenarios[group] = [currentStandings];
      continue;
    }

    const scCount = Math.pow(2, uncompleted.length);
    const scList: GroupStandingInfo[][] = [];

    for (let s = 0; s < scCount; s++) {
      const tempMatches = groupMatches.map(m => {
        if (m.status === 'completed') return m;
        const idx = uncompleted.indexOf(m);
        const team1Won = (s & (1 << idx)) === 0;
        return {
          ...m,
          status: 'completed' as const,
          winnerId: team1Won ? m.team1Id : m.team2Id,
          team1Score: team1Won ? 3 : 0,
          team2Score: team1Won ? 0 : 3,
        };
      });

      const std = computeGroupStandings(teams, tempMatches, group);
      scList.push(std);
    }
    groupScenarios[group] = scList;
  }

  // 2. 조별 1, 2, 3위 확정 판정
  for (const group of groups) {
    const scs = groupScenarios[group];
    if (scs.length === 0) continue;

    const firstSc = scs[0];
    const teamIds = firstSc.map(x => x.teamId);

    for (const tId of teamIds) {
      let alwaysFirst = true;
      let alwaysSecond = true;
      let alwaysThird = true;

      for (const sc of scs) {
        const idxOfTeam = sc.findIndex(x => x.teamId === tId);
        if (idxOfTeam !== 0) alwaysFirst = false;
        if (idxOfTeam !== 1) alwaysSecond = false;
        if (idxOfTeam !== 2) alwaysThird = false;
      }

      if (alwaysFirst) placements[group][1] = tId;
      if (alwaysSecond) placements[group][2] = tId;
      if (alwaysThird) placements[group][3] = tId;
    }
  }

  return placements;
};

export const updateHybridSemiFinals = (teams: Team[], matches: MatchItem[]): MatchItem[] => {
  const placements = getDeterministicBracketPlacements(teams, matches);

  const qf_1_team1 = placements.A[1];
  const qf_1_team2 = placements.C[2];
  const qf_2_team1 = placements.B[1];
  const qf_2_team2 = placements.A[3];
  const qf_3_team1 = placements.C[1];
  const qf_3_team2 = placements.B[3];
  const qf_4_team1 = placements.A[2];
  const qf_4_team2 = placements.B[2];

  return matches.map(m => {
    if (m.id === 'QF_1') {
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : qf_1_team1,
        team2Id: m.status === 'completed' ? m.team2Id : qf_1_team2,
      };
    }
    if (m.id === 'QF_2') {
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : qf_2_team1,
        team2Id: m.status === 'completed' ? m.team2Id : qf_2_team2,
      };
    }
    if (m.id === 'QF_3') {
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : qf_3_team1,
        team2Id: m.status === 'completed' ? m.team2Id : qf_3_team2,
      };
    }
    if (m.id === 'QF_4') {
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : qf_4_team1,
        team2Id: m.status === 'completed' ? m.team2Id : qf_4_team2,
      };
    }

    if (m.id === 'SF_1') {
      const qf1 = matches.find(x => x.id === 'QF_1')!;
      const qf2 = matches.find(x => x.id === 'QF_2')!;
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : (qf1.status === 'completed' ? qf1.winnerId : null),
        team2Id: m.status === 'completed' ? m.team2Id : (qf2.status === 'completed' ? qf2.winnerId : null),
      };
    }
    if (m.id === 'SF_2') {
      const qf3 = matches.find(x => x.id === 'QF_3')!;
      const qf4 = matches.find(x => x.id === 'QF_4')!;
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : (qf3.status === 'completed' ? qf3.winnerId : null),
        team2Id: m.status === 'completed' ? m.team2Id : (qf4.status === 'completed' ? qf4.winnerId : null),
      };
    }
    if (m.id === 'GF_1') {
      const sf1 = matches.find(x => x.id === 'SF_1')!;
      const sf2 = matches.find(x => x.id === 'SF_2')!;
      return {
        ...m,
        team1Id: m.status === 'completed' ? m.team1Id : (sf1.status === 'completed' ? sf1.winnerId : null),
        team2Id: m.status === 'completed' ? m.team2Id : (sf2.status === 'completed' ? sf2.winnerId : null),
      };
    }
    return m;
  });
};

const generateInitialData = (numTeams: number, playersPerTeam: number, matchFormat: 'hybrid' | 'tournament' = 'hybrid', customTeams?: Team[]): { teams: Team[], matches: MatchItem[] } => {
  const mockTeams: Team[] = Array.from({ length: numTeams }).map((_, i) => {
    const predefined = predefinedTeams[i];
    return {
      id: `T${i + 1}`,
      name: predefined ? predefined.name : `Team ${i + 1}`,
      players: Array.from({ length: playersPerTeam }).map((_, j) => ({
        id: `P${i + 1}_${j + 1}`,
        name: predefined && predefined.players[j] ? predefined.players[j] : `Player ${(i * playersPerTeam) + j + 1}`,
      })),
    };
  });
  
  const teams = customTeams || mockTeams;

  if (matchFormat === 'hybrid') {
    const groupATeams = teams.filter((_, idx) => idx % 3 === 0);
    const groupBTeams = teams.filter((_, idx) => idx % 3 === 1);
    const groupCTeams = teams.filter((_, idx) => idx % 3 === 2);

    const matches: MatchItem[] = [];
    let matchCounter = 1;

    // Group A round robin (BO5)
    for (let i = 0; i < groupATeams.length; i++) {
      for (let j = i + 1; j < groupATeams.length; j++) {
        const mId = `GM_A_${matchCounter++}`;
        matches.push({
          id: mId,
          round: -1,
          matchIndex: matchCounter,
          team1Id: groupATeams[i].id,
          team2Id: groupATeams[j].id,
          sets: Array.from({ length: 5 }).map((_, sIdx) => ({
            id: `SET_${mId}_${sIdx}`,
            team1PlayerId: null,
            team2PlayerId: null,
            winnerTeamId: null,
          })),
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winnerId: null,
          nextMatchId: null,
          isGroupStage: true,
          groupName: 'A'
        });
      }
    }

    // Group B round robin (BO5)
    for (let i = 0; i < groupBTeams.length; i++) {
      for (let j = i + 1; j < groupBTeams.length; j++) {
        const mId = `GM_B_${matchCounter++}`;
        matches.push({
          id: mId,
          round: -1,
          matchIndex: matchCounter,
          team1Id: groupBTeams[i].id,
          team2Id: groupBTeams[j].id,
          sets: Array.from({ length: 5 }).map((_, sIdx) => ({
            id: `SET_${mId}_${sIdx}`,
            team1PlayerId: null,
            team2PlayerId: null,
            winnerTeamId: null,
          })),
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winnerId: null,
          nextMatchId: null,
          isGroupStage: true,
          groupName: 'B'
        });
      }
    }

    // Group C round robin (BO5)
    for (let i = 0; i < groupCTeams.length; i++) {
      for (let j = i + 1; j < groupCTeams.length; j++) {
        const mId = `GM_C_${matchCounter++}`;
        matches.push({
          id: mId,
          round: -1,
          matchIndex: matchCounter,
          team1Id: groupCTeams[i].id,
          team2Id: groupCTeams[j].id,
          sets: Array.from({ length: 5 }).map((_, sIdx) => ({
            id: `SET_${mId}_${sIdx}`,
            team1PlayerId: null,
            team2PlayerId: null,
            winnerTeamId: null,
          })),
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winnerId: null,
          nextMatchId: null,
          isGroupStage: true,
          groupName: 'C'
        });
      }
    }

    const qf1Id = 'QF_1';
    const qf2Id = 'QF_2';
    const qf3Id = 'QF_3';
    const qf4Id = 'QF_4';
    const sf1Id = 'SF_1';
    const sf2Id = 'SF_2';
    const gfId = 'GF_1';

    // 8강 대형 (BO7)
    const qfs = [qf1Id, qf2Id, qf3Id, qf4Id];
    qfs.forEach((qfId, idx) => {
      matches.push({
        id: qfId,
        round: 0,
        matchIndex: idx,
        team1Id: null,
        team2Id: null,
        sets: Array.from({ length: 7 }).map((_, sIdx) => ({
          id: `SET_${qfId}_${sIdx}`,
          team1PlayerId: null,
          team2PlayerId: null,
          winnerTeamId: null,
        })),
        team1Score: 0,
        team2Score: 0,
        status: 'pending',
        winnerId: null,
        nextMatchId: idx < 2 ? sf1Id : sf2Id,
        isGroupStage: false,
        groupName: null
      });
    });

    // 4강 (BO7)
    const sfs = [sf1Id, sf2Id];
    sfs.forEach((sfId, idx) => {
      matches.push({
        id: sfId,
        round: 1,
        matchIndex: idx,
        team1Id: null,
        team2Id: null,
        sets: Array.from({ length: 7 }).map((_, sIdx) => ({
          id: `SET_${sfId}_${sIdx}`,
          team1PlayerId: null,
          team2PlayerId: null,
          winnerTeamId: null,
        })),
        team1Score: 0,
        team2Score: 0,
        status: 'pending',
        winnerId: null,
        nextMatchId: gfId,
        isGroupStage: false,
        groupName: null
      });
    });

    // 결승전 (BO7)
    matches.push({
      id: gfId,
      round: 2,
      matchIndex: 0,
      team1Id: null,
      team2Id: null,
      sets: Array.from({ length: 7 }).map((_, sIdx) => ({
        id: `SET_${gfId}_${sIdx}`,
        team1PlayerId: null,
        team2PlayerId: null,
        winnerTeamId: null,
      })),
      team1Score: 0,
      team2Score: 0,
      status: 'pending',
      winnerId: null,
      nextMatchId: null,
      isGroupStage: false,
      groupName: null
    });

    let initialFullMatches = matches;
    initialFullMatches = updateHybridSemiFinals(teams, initialFullMatches);

    return { teams, matches: initialFullMatches };
  } else {
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(numTeams, 2))));
    const numRounds = Math.log2(bracketSize);
    const matches: MatchItem[] = [];
    let matchCounter = 1;

    for (let r = 0; r < numRounds; r++) {
      const matchesInRound = bracketSize / Math.pow(2, r + 1);
      for (let m = 0; m < matchesInRound; m++) {
        matches.push({
          id: `M${matchCounter++}`,
          round: r,
          matchIndex: m,
          team1Id: r === 0 ? (teams[m * 2]?.id || null) : null,
          team2Id: r === 0 ? (teams[m * 2 + 1]?.id || null) : null,
          sets: Array.from({ length: 7 }).map((_, sIdx) => ({
            id: `SET_${matchCounter}_${sIdx}`,
            team1PlayerId: null,
            team2PlayerId: null,
            winnerTeamId: null,
          })),
          team1Score: 0,
          team2Score: 0,
          status: 'pending',
          winnerId: null,
          nextMatchId: null,
        });
      }
    }

    for (let r = 0; r < numRounds - 1; r++) {
      const roundMatches = matches.filter((m) => m.round === r);
      const nextRoundMatches = matches.filter((m) => m.round === r + 1);
      roundMatches.forEach((match, idx) => {
        match.nextMatchId = nextRoundMatches[Math.floor(idx / 2)].id;
      });
    }

    const round0 = matches.filter(m => m.round === 0);
    round0.forEach(m => {
      if (m.team1Id && !m.team2Id) {
        m.status = 'completed';
        m.team1Score = 4;
        m.winnerId = m.team1Id;
        const nextM = matches.find(nm => nm.id === m.nextMatchId);
        if (nextM) {
          if (m.matchIndex % 2 === 0) nextM.team1Id = m.winnerId;
          else nextM.team2Id = m.winnerId;
        }
      } else if (!m.team1Id && m.team2Id) {
        m.status = 'completed';
        m.team2Score = 4;
        m.winnerId = m.team2Id;
        const nextM = matches.find(nm => nm.id === m.nextMatchId);
        if (nextM) {
          if (m.matchIndex % 2 === 0) nextM.team1Id = m.winnerId;
          else nextM.team2Id = m.winnerId;
        }
      } else if (!m.team1Id && !m.team2Id) {
        m.status = 'completed';
      }
    });

    return { teams, matches };
  }
};

type Action =
  | { type: 'SHUFFLE_BRACKET' }
  | { type: 'SHUFFLE_GROUPS' }
  | { type: 'RESET_BRACKET' }
  | { type: 'UPDATE_TEAM'; payload: { teamId: string; name: string } }
  | { type: 'UPDATE_PLAYER'; payload: { teamId: string; playerId: string; name: string } }
  | { type: 'SET_CURRENT_MATCH'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<TournamentSettings> }
  | { type: 'SUBMIT_SET_RESULT'; payload: { matchId: string; setIndex: number; team1PlayerId: string; team2PlayerId: string; winnerTeamId: string; team1Character?: string | null; team2Character?: string | null } }
  | { type: 'RESET_SET_RESULT'; payload: { matchId: string; setIndex: number } }
  | { type: 'COMPLETE_MATCH'; payload: string }
  | { type: 'BATCH_UPDATE_TEAM'; payload: { teamId: string; name: string; players: string[] } }
  | { type: 'ADD_TEAM' }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'SYNC_FROM_SERVER'; payload: TournamentState };

const LOCAL_STORAGE_KEY = 'bj_lol_tournament_bracket_state';

const getInitialState = (): TournamentState => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.settings && parsed.teams && parsed.matches) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("localStorage load failed:", e);
    }
  }
  return {
    settings: { numTeams: 11, playersPerTeam: 6, setsToWin: 4, matchType: 'winners', matchFormat: 'hybrid' },
    ...generateInitialData(11, 6, 'hybrid'),
    currentMatchId: null,
  };
};

const initialState: TournamentState = getInitialState();

const tournamentReducer = (state: TournamentState, action: Action): TournamentState => {
  switch (action.type) {
    case 'SYNC_FROM_SERVER': {
      return action.payload;
    }
    case 'SHUFFLE_BRACKET':
    case 'SHUFFLE_GROUPS': {
      // Check if bracket can be shuffled: no active matches, no non-bye matches completed, no set scores recorded.
      const hasAction = state.matches.some(m => 
        m.status === 'in_progress' ||
        (m.status === 'completed' && m.winnerId !== null && !m.isGroupStage) ||
        m.sets.some(s => s.winnerTeamId !== null)
      );

      if (hasAction) {
        return state;
      }

      const numTeams = state.settings.numTeams;
      const playersPerTeam = state.settings.playersPerTeam;
      const matchFormat = state.settings.matchFormat || 'hybrid';

      // Shuffle the teams array
      const shuffledTeams = [...state.teams].sort(() => Math.random() - 0.5);
      const pristine = generateInitialData(numTeams, playersPerTeam, matchFormat, shuffledTeams);

      return {
        ...state,
        teams: shuffledTeams,
        matches: pristine.matches,
        currentMatchId: null
      };
    }
    case 'RESET_BRACKET': {
      const numTeams = state.settings.numTeams;
      const playersPerTeam = state.settings.playersPerTeam;
      const matchFormat = state.settings.matchFormat || 'hybrid';
      
      const pristine = generateInitialData(numTeams, playersPerTeam, matchFormat);
      
      // If hybrid, reset uses existing team positions but clears all match outcomes
      let updatedMatches = pristine.matches;
      if (matchFormat === 'hybrid') {
        // compute based on current (not shuffled) teams
        updatedMatches = updateHybridSemiFinals(state.teams, pristine.matches);
      }

      return {
        ...state,
        matches: updatedMatches,
        currentMatchId: null
      };
    }
    case 'UPDATE_TEAM': {
      const { teamId, name } = action.payload;
      return {
        ...state,
        teams: state.teams.map(t => t.id === teamId ? { ...t, name } : t)
      };
    }
    case 'BATCH_UPDATE_TEAM': {
      const { teamId, name, players } = action.payload;
      return {
        ...state,
        teams: state.teams.map(t => {
          if (t.id !== teamId) return t;
          return {
            ...t,
            name,
            players: t.players.map((p, idx) => ({
              ...p,
              name: players[idx] || p.name
            }))
          };
        })
      };
    }
    case 'UPDATE_PLAYER': {
      const { teamId, playerId, name } = action.payload;
      return {
        ...state,
        teams: state.teams.map(t => {
          if (t.id !== teamId) return t;
          return { ...t, players: t.players.map(p => p.id === playerId ? { ...p, name } : p) };
        })
      };
    }
    case 'SET_CURRENT_MATCH': {
      return { ...state, currentMatchId: action.payload };
    }
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      if (
        newSettings.numTeams !== state.settings.numTeams || 
        newSettings.playersPerTeam !== state.settings.playersPerTeam ||
        newSettings.matchFormat !== state.settings.matchFormat
      ) {
        // Reset everything if structure changes
        const { teams, matches } = generateInitialData(
          newSettings.numTeams, 
          newSettings.playersPerTeam, 
          newSettings.matchFormat || 'hybrid'
        );
        return { settings: newSettings, teams, matches, currentMatchId: null };
      }
      return { ...state, settings: newSettings };
    }
    case 'SUBMIT_SET_RESULT': {
      const { matchId, setIndex, team1PlayerId, team2PlayerId, winnerTeamId, team1Character, team2Character } = action.payload;
      let newMatch: MatchItem | null = null;
      
      let newMatches = state.matches.map(m => {
        if (m.id !== matchId) return m;
        const newSets = [...m.sets];
        newSets[setIndex] = {
          ...newSets[setIndex],
          team1PlayerId,
          team2PlayerId,
          winnerTeamId,
          team1Character,
          team2Character
        };
        const team1Score = newSets.filter(s => s.winnerTeamId === m.team1Id).length;
        const team2Score = newSets.filter(s => s.winnerTeamId === m.team2Id).length;
        
        // 5전 3선승(isGroupStage)은 3승 선점, 7전 4선승(토너먼트)은 4승 선점에 따라 기결정
        const targetSetsToWin = m.isGroupStage ? 3 : state.settings.setsToWin;
        const hasWinner = team1Score >= targetSetsToWin || team2Score >= targetSetsToWin;
        const winnerId = team1Score >= targetSetsToWin ? m.team1Id : (team2Score >= targetSetsToWin ? m.team2Id : null);

        newMatch = {
          ...m,
          sets: newSets,
          team1Score,
          team2Score,
          status: (hasWinner ? 'completed' : (m.status === 'pending' ? 'in_progress' : m.status)) as MatchStatus,
          winnerId: hasWinner ? winnerId : null
        };
        return newMatch;
      });
      
      // If tournament mode is non-hybrid, propagate the winner automatically
      if (newMatch && (newMatch as MatchItem).status === 'completed' && state.settings.matchFormat !== 'hybrid') {
        const completedMatch = newMatch as MatchItem;
        const winnerIdStr = completedMatch.winnerId;
        newMatches = newMatches.map(m => {
          if (m.id === completedMatch.nextMatchId) {
            if (completedMatch.matchIndex % 2 === 0) {
              return { ...m, team1Id: winnerIdStr };
            } else {
              return { ...m, team2Id: winnerIdStr };
            }
          }
          return m;
        });
      }
      
      if (state.settings.matchFormat === 'hybrid') {
        newMatches = updateHybridSemiFinals(state.teams, newMatches);
      }
      
      return { ...state, matches: newMatches };
    }
    case 'RESET_SET_RESULT': {
      const { matchId, setIndex } = action.payload;
      const targetMatch = state.matches.find(m => m.id === matchId);
      if (!targetMatch) return state;

      const previousWinnerId = targetMatch.winnerId;

      let newMatches = state.matches.map(m => {
        if (m.id === matchId) {
          const newSets = [...m.sets];
          newSets[setIndex] = {
            ...newSets[setIndex],
            winnerTeamId: null,
          };
          const team1Score = newSets.filter(s => s.winnerTeamId === m.team1Id).length;
          const team2Score = newSets.filter(s => s.winnerTeamId === m.team2Id).length;

          return {
            ...m,
            sets: newSets,
            team1Score,
            team2Score,
            status: 'in_progress' as MatchStatus,
            winnerId: null,
          } as MatchItem;
        }

        if (previousWinnerId && m.id === targetMatch.nextMatchId && m.status !== 'completed') {
          const updated: MatchItem = { ...m };
          if (updated.team1Id === previousWinnerId) updated.team1Id = null;
          if (updated.team2Id === previousWinnerId) updated.team2Id = null;
          return updated;
        }

        return m as MatchItem;
      });

      if (state.settings.matchFormat === 'hybrid') {
        newMatches = updateHybridSemiFinals(state.teams, newMatches);
      }

      return { ...state, matches: newMatches };
    }
    case 'COMPLETE_MATCH': {
      const matchId = action.payload;
      const match = state.matches.find(m => m.id === matchId);
      if (!match || match.status === 'completed') return state;

      const targetSetsToWin = match.isGroupStage ? 3 : state.settings.setsToWin;
      const winnerIdStr = match.team1Score >= targetSetsToWin ? match.team1Id : match.team2Score >= targetSetsToWin ? match.team2Id : null;
      if (!winnerIdStr) return state; // Neither reached winning score

      let nextMatches = [...state.matches];
      nextMatches = nextMatches.map(m => {
        if (m.id === matchId) {
          return { ...m, status: 'completed', winnerId: winnerIdStr };
        }
        if (m.id === match.nextMatchId) {
          if (match.matchIndex % 2 === 0) {
            return { ...m, team1Id: winnerIdStr };
          } else {
            return { ...m, team2Id: winnerIdStr };
          }
        }
        return m;
      });

      if (state.settings.matchFormat === 'hybrid') {
        nextMatches = updateHybridSemiFinals(state.teams, nextMatches);
      }

      return {
        ...state,
        matches: nextMatches,
        currentMatchId: state.currentMatchId === matchId ? null : state.currentMatchId
      };
    }
    case 'ADD_TEAM': {
      const newNumTeams = state.settings.numTeams + 1;
      if (newNumTeams > 32) return state;
      
      const newSettings = { ...state.settings, numTeams: newNumTeams };
      
      // Create a specific new team object to append
      const newTeam: Team = {
        id: `T_DYNAMIC_${uuid()}`,
        name: `새로운 팀 ${newNumTeams}`,
        players: Array.from({ length: state.settings.playersPerTeam }).map((_, j) => ({
          id: `P_DYNAMIC_${uuid()}_${j + 1}`,
          name: `선수 ${j + 1}`,
        })),
      };

      const { teams, matches } = generateInitialData(
        newNumTeams, 
        newSettings.playersPerTeam, 
        newSettings.matchFormat || 'hybrid',
        [...state.teams, newTeam]
      );
      return { ...state, settings: newSettings, teams, matches, currentMatchId: null };
    }
    case 'DELETE_TEAM': {
      const teamId = action.payload;
      if (state.teams.length <= 2) return state;

      const newNumTeams = state.teams.length - 1;
      const newTeams = state.teams.filter(t => t.id !== teamId);
      const newSettings = { ...state.settings, numTeams: newNumTeams };

      const { teams, matches } = generateInitialData(
        newNumTeams,
        newSettings.playersPerTeam,
        newSettings.matchFormat || 'hybrid',
        newTeams
      );
      return { ...state, settings: newSettings, teams, matches, currentMatchId: null };
    }
    default:
      return state;
  }
};

const TournamentContext = createContext<{
  state: TournamentState;
  dispatch: Dispatch<Action>;
} | null>(null);

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(tournamentReducer, initialState);
  const lastServerStateRef = useRef<string>('');
  const hasSyncedRef = useRef<boolean>(false);

  // 1. Initial Load & Synchronization
  useEffect(() => {
    let active = true;

    async function syncInitial() {
      try {
        const response = await fetch('/api/tournament-state');
        const result = await response.json();
        
        if (active) {
          if (result.success && result.data) {
            const serverStateStr = JSON.stringify(result.data);
            lastServerStateRef.current = serverStateStr;
            dispatch({ type: 'SYNC_FROM_SERVER', payload: result.data });
            hasSyncedRef.current = true;
          } else {
            // Server has no state yet or failed to load.
            // We mark as synced so that our local state (reloaded from localStorage) can be pushed to server.
            hasSyncedRef.current = true;
          }
        }
      } catch (err) {
        console.warn('Failed to perform initial server synchronization:', err);
        // Even if failed, we mark as synced after attempt to allow local changes to flow if needed
        hasSyncedRef.current = true;
      }
    }

    syncInitial();

    return () => {
      active = false;
    };
  }, []);

  // 2. State-change listener to push up state cleanly
  useEffect(() => {
    // Save to localStorage
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }

    // ONLY administrators can push changes to server! Spectators only sync from server.
    const expiresAt = typeof window !== 'undefined' ? window.localStorage.getItem('auth_expires_at') : null;
    const isAdminUser = expiresAt && Date.now() < parseInt(expiresAt);
    if (!isAdminUser) return;

    // Only push to server if we have successfully synced from it at least once (to avoid overwriting with defaults)
    if (!hasSyncedRef.current) return;

    const currentStr = JSON.stringify(state);
    if (currentStr && currentStr !== lastServerStateRef.current) {
      lastServerStateRef.current = currentStr;
      
      fetch('/api/tournament-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      }).catch(err => {
        console.warn('Failed to sync state to server:', err);
      });
    }
  }, [state]);

  // 3. Periodic polling to keep other clients updated
  useEffect(() => {
    const handle = setInterval(async () => {
      // Only poll if we have finished the initial sync attempt
      if (!hasSyncedRef.current) return;

      try {
        const response = await fetch('/api/tournament-state');
        const result = await response.json();
        if (result.success && result.data) {
          const serverStateStr = JSON.stringify(result.data);
          if (serverStateStr !== lastServerStateRef.current) {
            lastServerStateRef.current = serverStateStr;
            dispatch({ type: 'SYNC_FROM_SERVER', payload: result.data });
          }
        }
      } catch (err) {
        // Silent catch for intermittent network issues
      }
    }, 3000);

    return () => clearInterval(handle);
  }, []);

  return (
    <TournamentContext.Provider value={{ state, dispatch }}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) throw new Error('useTournament must be used within Provider');
  return context;
};
