export type Game = {
  currentStats?: TeamStats;
  gameStats?: GameStats;
  goals: Goal[];
  errors?: StatError[];
  links?: Links;
  preGameStats?: TeamStats;
  startTime: string;
  status: GameStatus;
  teams: Teams;
};

export type GameProgress = {
  currentPeriod: number;
  currentPeriodOrdinal: string;
  currentPeriodTimeRemaining: Pick<TimeElapsed, 'min' | 'sec'> & { pretty: string };
};

export type GameStats = {
  blocked: TeamValues<number>;
  faceOffWinPercentage: TeamValues<string>;
  giveaways: TeamValues<number>;
  hits: TeamValues<number>;
  pim: TeamValues<number>;
  powerPlay: TeamValues<{ goals: number; opportunities: number; percentage: string }>;
  shots: TeamValues<number>;
  takeaways: TeamValues<number>;
};

export type GameState = 'FINAL' | 'LIVE' | 'POSTPONED' | 'PREVIEW';

type GameStatusLive = {
  progress: GameProgress;
  state: 'LIVE';
};
type GameStatusNonLive = {
  state: 'FINAL' | 'POSTPONED' | 'PREVIEW';
};
export type GameStatus = GameStatusLive | GameStatusNonLive;

export type GoalInGamePlay = TimeElapsed & {
  assists: PointScorer[];
  emptyNet?: boolean;
  scorer: PointScorer;
  strength?: 'PPG' | 'SHG';
  team: TeamAbbreviation;
};
export type GoalInShootout = {
  period: 'SO';
  scorer: PointScorer;
  team: TeamAbbreviation;
};
export type Goal = GoalInGamePlay | GoalInShootout;

export function isShootoutGoal(goal: Goal): goal is GoalInShootout {
  return goal.period === 'SO';
}

export type Links = {
  gameCenter?: string;
  playoffSeries?: string;
  videoRecap?: string;
};

type PointScorer = {
  player: string;
  playerId: number;
  seasonTotal: number;
};

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
  wins: TeamValues<number>;
};

export type TeamRecord = { losses: number; ot?: number; wins: number };

export type TeamStats = {
  playoffSeries?: TeamPlayoffSeries;
  records: TeamValues<TeamRecord>;
  standings: TeamValues<{
    conferenceRank: string;
    divisionRank: string;
    leagueRank: string;
    pointsFromPlayoffSpot: string;
  }>;
  streaks?: TeamValues<TeamStreak> | null;
};

export type TeamStreak = { count: number; type: 'WINS' | 'LOSSES' | 'OT' };

export type TeamValues<T> = Record<TeamAbbreviation, T>;

type TimeElapsed = {
  period: string;
  min: number;
  sec: number;
};

type TeamGoals = TeamValues<number>;
export type TeamScores = TeamGoals & {
  overtime?: true;
  shootout?: true;
};
