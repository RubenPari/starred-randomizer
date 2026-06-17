export interface Repo {
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  topics: string[];
  updated_at: string;
  created_at: string;
  archived: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface HistoryEntry {
  repo: Repo;
  timestamp: number;
}

export interface HiddenGemScore {
  repo: Repo;
  score: number;
  breakdown: {
    recencyScore: number;
    popularityScore: number;
    engagementScore: number;
  };
}

export interface LanguageStat {
  language: string;
  count: number;
  totalStars: number;
}

export interface StarActivity {
  date: string;
  count: number;
}

export interface TopicStat {
  topic: string;
  count: number;
}

export interface RepoStats {
  totalRepos: number;
  totalStars: number;
  avgStars: number;
  languages: LanguageStat[];
  repoCreationActivity: StarActivity[];
  monthlyActivity: StarActivity[];
  topTopics: TopicStat[];
  archivedCount: number;
}

export interface RepoFilters {
  language: string;
  min_stars: number;
  topic: string;
  include_archived: boolean;
  updated_after: string;
}