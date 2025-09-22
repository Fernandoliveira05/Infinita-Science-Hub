// src/pages/Starred.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { GitFork, DollarSign, Star } from "lucide-react";
import Navbar from "../components/layouts/Navbar";

const repoApi = axios.create({ baseURL: "http://localhost:55403/api/repos" });

repoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Repository = {
  id: string;
  name: string;
  description?: string;
  forks: number;
  donations: number;
  updated_at: string;
  visibility: string;
  owner_address: string;
};

const Starred = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStarred = async () => {
      try {
        const res = await repoApi.get("/starred");
        setRepos(res.data);
      } catch (err) {
        console.error("Error loading starred repos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStarred();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentTitle="Starred Repositories" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" /> Starred Repositories
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading your favorites...</p>
        ) : repos.length > 0 ? (
          <div className="grid gap-6">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="border border-border rounded-xl p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link
                      to={`/repository/${repo.id}`}
                      className="text-lg font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {repo.name}
                    </Link>
                    <p className="text-gray-500 text-sm">
                      {repo.description || "No description provided"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Updated {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-200">
                    {repo.visibility}
                  </span>
                </div>

                <div className="flex gap-6 text-sm text-gray-500">
                  <span className="flex gap-2 items-center">
                    <GitFork className="w-4 h-4" /> {repo.forks} forks
                  </span>
                  <span className="flex gap-2 items-center">
                    <DollarSign className="w-4 h-4" /> {repo.donations} ETH
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Owner: {repo.owner_address}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You don’t have any starred repositories yet.</p>
        )}
      </main>
    </div>
  );
};

export default Starred;
