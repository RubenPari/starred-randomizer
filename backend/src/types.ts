export interface Repo {
  full_name: string;
  html_url: string;
  description: string;
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

export interface GithubApiError {
  ok: false;
  status: number;
  body: unknown;
}

export interface GithubApiResponse {
  ok: true;
  data: Repo[];
  hasNext: boolean;
}

export interface FetchAllResult {
  ok: false;
  status: number;
  body: unknown;
}

export interface FetchAllSuccess {
  ok: true;
  data: Repo[];
}
