export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type MatchSet = {
  id: string;
  team1PlayerId: string | null;
  team2PlayerId: string | null;
  winnerTeamId: string | null; // team1Id or team2Id
  team1Character?: string | null;
  team2Character?: string | null;
};

export type MatchStatus = 'pending' | 'in_progress' | 'completed';

export type MatchItem = {
  id: string;
  round: number; // 0 for Quarter, 1 for Semi, etc.
  matchIndex: number;
  team1Id: string | null;
  team2Id: string | null;
  sets: MatchSet[];
  team1Score: number;
  team2Score: number;
  status: MatchStatus;
  winnerId: string | null;
  nextMatchId: string | null;
  isGroupStage?: boolean;
  groupName?: 'A' | 'B' | 'C' | null;
};

export type TournamentSettings = {
  numTeams: number; // 4, 8, 16, etc.
  playersPerTeam: number; // typically 6
  setsToWin: number; // 4 (Best of 7)
  matchType: 'winners' | 'individual';
  matchFormat?: 'hybrid' | 'tournament';
};

export type TournamentState = {
  settings: TournamentSettings;
  teams: Team[];
  matches: MatchItem[];
  currentMatchId: string | null;
};

