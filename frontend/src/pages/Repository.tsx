import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom"; // NOVO: useNavigate
import axios from "axios";
import { format } from "date-fns";
import {
  ArrowLeft,
  GitFork,
  Star,
  Share,
  Download,
  User,
  Clock,
  Hash,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "../components/layouts/Navbar";
import { AuthWidget } from "./Explore";

// ==========================================================
// API CLIENT CONFIGURATION (AXIOS)
// ==========================================================
const publicApi = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

// NOVO: Cliente de API autenticado para ações do usuário
const authenticatedApi = axios.create({ baseURL: "http://127.0.0.1:8000/api" });
authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================================
// DATA TYPES
// ==========================================================
// (os tipos de dados permanecem os mesmos)
type Collaborator = {
  username: string;
  address: string;
  role: "owner" | "collaborator";
};
type RepositoryData = {
  id: string;
  name: string;
  owner_address: string;
  created_at: string;
  description: string;
  forks: number;
  stars: number;
  collaborators: Collaborator[];
};
type BlockData = {
  id: string;
  title: string;
  description: string;
  block_type: string;
};

// ==========================================================
// BLOCKS TAB COMPONENT
// ==========================================================
// (o componente BlocksTabContent permanece o mesmo)
const BlocksTabContent: React.FC<{ repoId: string }> = ({ repoId }) => {
  /* ... seu código ... */
};

// ==========================================================
// MAIN PAGE COMPONENT
// ==========================================================
const Repository = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // NOVO: para redirecionar se o login for necessário

  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("blocks");

  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [isStarring, setIsStarring] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchRepositoryData = async () => {
      try {
        const res = await publicApi.get(`/repos/${id}`);
        setRepository(res.data);
        setStarCount(res.data.stars);
      } catch (err) {
        console.error(err);
      }
    };

    const checkIfStarred = async () => {
      if (!localStorage.getItem("jwt_token")) return;
      try {
        const res = await authenticatedApi.get(`/repos/starred`);
        const starredRepos = res.data as RepositoryData[];
        setIsStarred(starredRepos.some((r) => r.id === id));
      } catch (err) {
        console.error("Failed to check starred status:", err);
      }
    };

    fetchRepositoryData();
    checkIfStarred();
  }, [id]);

  const handleStarClick = async () => {
    if (!localStorage.getItem("jwt_token")) {
      navigate("/login");
      return;
    }
    if (!id) return;

    setIsStarring(true);
    try {
      if (isStarred) {
        // Se já está favoritado → desfavoritar
        await authenticatedApi.delete(`/repos/${id}/star`);
        setStarCount((prev) => Math.max(prev - 1, 0));
        setIsStarred(false);
      } else {
        // Se não está favoritado → favoritar
        await authenticatedApi.post(`/repos/${id}/star`);
        setStarCount((prev) => prev + 1);
        setIsStarred(true);
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
      alert("An error occurred while updating favorite status.");
    } finally {
      setIsStarring(false);
    }
  };

  if (isLoading) {
    /* ... (lógica de loading permanece a mesma) ... */
  }
  if (error) {
    /* ... (lógica de erro permanece a mesma) ... */
  }
  if (!repository) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <AuthWidget />
      </Navbar>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        {/* Cabeçalho do Repositório */}
        <div className="card-professional mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              {/* ... (detalhes do título, autor, data, etc.) ... */}
              <p className="text-3xl font-extrabold text-foreground leading-relaxed mb-6">
                {repository.name}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {repository.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {/* NOVO: Usa o estado `starCount` para a contagem */}
                  <Star className="w-4 h-4" />
                  {starCount} stars
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4" />
                  {repository.forks} forks
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-48">
              <button className="btn-primary flex items-center justify-center gap-2">
                <GitFork className="w-4 h-4" /> Fork Repository
              </button>

              {/* NOVO: Botão "Star" dinâmico */}
              <button
                onClick={handleStarClick}
                disabled={isStarring}
                className={`btn-secondary flex items-center justify-center gap-2 ${
                  isStarred
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : ""
                }`}
              >
                <Star
                  className={`w-4 h-4 ${
                    isStarred ? "fill-current text-amber-500" : ""
                  }`}
                />
                {isStarring ? "Loading..." : isStarred ? "Starred" : "Star"}
              </button>

              <button className="btn-ghost flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-professional">
          <div className="border-b border-border mb-6">
            <nav className="flex space-x-8">
              {["blocks", "references", "license", "discussions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === "blocks" && (
              <BlocksTabContent repoId={repository.id} />
            )}
            {activeTab === "references" && (
              <div>References Content (to be integrated)</div>
            )}
            {activeTab === "license" && (
              <div>License Content (to be integrated)</div>
            )}
            {activeTab === "discussions" && (
              <div>Discussions Content (to be integrated)</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repository;
