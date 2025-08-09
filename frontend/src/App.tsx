import { useState } from 'react';
import axios from 'axios';

interface Repo {
  full_name: string;
  html_url: string;
  description: string;
  language: string | null;
  stargazers_count: number;
}

function App() {
  const [username, setUsername] = useState<string>('');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [randomRepo, setRandomRepo] = useState<Repo | null>(null);
  const [filters, setFilters] = useState<{ language: string; min_stars: string }>({ language: '', min_stars: '' });

  const fetchStarred = async () => {
    try {
      const res = await axios.get<Repo[]>(`/api/starred/${username}`);
      setRepos(res.data);
      setRandomRepo(null);
    } catch {
      alert('Errore nel recupero dei repository');
    }
  };

  const getRandom = async () => {
    try {
      const res = await axios.get<Repo>(`/api/random/${username}`, { params: filters });
      setRandomRepo(res.data);
    } catch (e: any) {
      alert(e.response?.data?.error || 'Errore casuale');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl mb-4">GitHub Starred Randomizer</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="GitHub username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={fetchStarred} className="mt-2 p-2 bg-blue-500 text-white rounded">
          Carica Starred
        </button>
      </div>

      {repos.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl">Filtri</h2>
          <input
            type="text"
            placeholder="Language"
            value={filters.language}
            onChange={e => setFilters(f => ({ ...f, language: e.target.value }))}
            className="border p-2 mr-2"
          />
          <input
            type="number"
            placeholder="Min stars"
            value={filters.min_stars}
            onChange={e => setFilters(f => ({ ...f, min_stars: e.target.value }))}
            className="border p-2"
          />
          <button onClick={getRandom} className="mt-2 p-2 bg-green-500 text-white rounded">
            Estrai Random
          </button>
        </div>
      )}

      {randomRepo && (
        <div className="border p-4 rounded">
          <h3 className="text-lg">{randomRepo.full_name}</h3>
          <p>{randomRepo.description}</p>
          <a href={randomRepo.html_url} target="_blank" rel="noopener noreferrer">
            Vai al repository
          </a>
        </div>
      )}
    </div>
  );
}

export default App;