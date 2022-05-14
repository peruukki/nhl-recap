export type Game = {
  goals: Goal[];
  preGameStats: TeamStats;
  status: GameStatus;
  teams: {
    away: Team;
    home: Team;
  };
};

export type GameProgress = {
  currentPeriod: number;
  currentPeriodOrdinal: string;
  currentPeriodTimeRemaining: TimeElapsed & { pretty: string };
};

type GameStatusLive = {
  progress: GameProgress;
  state: 'LIVE';
};
type GameStatusNonLive = {
  state: 'FINAL' | 'POSTPONED' | 'PREVIEW';
};
export type GameStatus = GameStatusLive | GameStatusNonLive;

type GoalInGamePlay = TimeElapsed & {
  assists: { player: string; seasonTotal: number }[];
  emptyNet?: boolean;
  scorer: { player: string; seasonTotal: number };
  strength?: 'PPG' | 'SHG';
  team: TeamAbbreviation;
};
type GoalInShootout = {
  period: 'SO';
  scorer: { player: string; seasonTotal: number };
  team: TeamAbbreviation;
};
export type Goal = GoalInGamePlay | GoalInShootout;

export function isShootoutGoal(goal: Goal): goal is GoalInShootout {
  return goal.period === 'SO';
}

export type Scores = {
  games: Game[];
};

type Team = {
  abbreviation: TeamAbbreviation;
  id: number;
  locationName: string;
  shortName: string;
  teamName: string;
};

type TeamAbbreviation = string;

type TeamStats = {
  playoffSeries: {
    round: number;
    wins: { [team: TeamAbbreviation]: number };
  };
  records: {
    [team: TeamAbbreviation]: { losses: number; ot?: number; wins: number };
  };
  standings: {
    [team: TeamAbbreviation]: {
      divisionRank: string;
      leagueRank: string;
      pointsFromPlayoffSpot: string;
    };
  };
};

type TimeElapsed = {
  period: string;
  min: number;
  sec: number;
};

type TeamGoals = {
  [team: TeamAbbreviation]: number;
};
export type TeamScores = TeamGoals & {
  overtime?: true;
  shootout?: true;
};
