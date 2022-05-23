export type Game = {
  gameStats: GameStats;
  goals: Goal[];
  errors?: StatError[];
  preGameStats: TeamStats;
  startTime: string;
  status: GameStatus;
  teams: Teams;
};

export type GameProgress = {
  currentPeriod: number;
  currentPeriodOrdinal: string;
  currentPeriodTimeRemaining: TimeElapsed & { pretty: string };
};

type GameStats = {
  blocked: { [team: TeamAbbreviation]: number };
  faceOffWinPercentage: { [team: TeamAbbreviation]: string };
  giveaways: { [team: TeamAbbreviation]: number };
  hits: { [team: TeamAbbreviation]: number };
  pim: { [team: TeamAbbreviation]: number };
  powerPlay: {
    [team: TeamAbbreviation]: { goals: number; opportunities: number; percentage: string };
  };
  shots: { [team: TeamAbbreviation]: number };
  takeaways: { [team: TeamAbbreviation]: number };
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
  date?: ScoresDate;
  games: Game[];
};
export type ScoresDate = { raw: string; pretty: string };

type StatErrorMissingAllGoals = {
  error: 'MISSING-ALL-GOALS';
};
type StatErrorScoreAndGoalCountMismatch = {
  details: { goalCount: number; scoreCount: number };
  error: 'SCORE-AND-GOAL-COUNT-MISMATCH';
};
export type StatError = StatErrorMissingAllGoals | StatErrorScoreAndGoalCountMismatch;

type Team = {
  abbreviation: TeamAbbreviation;
  id: number;
  locationName: string;
  shortName: string;
  teamName: string;
};
export type Teams = {
  away: Team;
  home: Team;
};

export type TeamAbbreviation = string;

export type TeamPlayoffSeries = {
  round: number;
  wins: { [team: TeamAbbreviation]: number };
};

export type TeamStats = {
  playoffSeries?: TeamPlayoffSeries;
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
