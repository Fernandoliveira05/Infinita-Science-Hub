// src/pages/Explore.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { Navbar } from "../components/layouts/Navbar";
import {
  Search, Filter, GitFork, Star, Clock, User as UserIcon, Hash, ChevronDown, LogOut, User as ProfileIcon, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ==========================================================
// CONFIGURAÇÃO DOS CLIENTES API (AXIOS)
// ==========================================================

// 1. Cliente para chamadas PÚBLICAS (não envia token)
const publicApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// 2. Cliente para chamadas AUTENTICADAS (envia o token JWT)
const authenticatedApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Interceptor que adiciona o token JWT APENAS ao cliente autenticado
authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// ==========================================================
// AUTH WIDGET (Usa a API autenticada)
// ==========================================================
// Este componente continua o mesmo, mas agora usa `authenticatedApi`.
// Lembre-se que o lugar ideal para ele é na sua `Navbar`, não aqui.
type UserProfile = {
  username: string;
  profile_image_url?: string;
};

export const AuthWidget: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    // Verifica se há token antes de tentar buscar o usuário
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        // Usa a instância autenticada
        const response = await authenticatedApi.get("/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Sessão inválida ou expirada.", error);
        localStorage.removeItem("jwt_token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    setMenuOpen(false);
    // Recarregar a página pode ser uma forma simples de resetar o estado da aplicação
    window.location.reload(); 
  };

  if (isLoading) {
    return <div className="w-32 h-10 bg-muted rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <Button onClick={() => navigate('/login')} className="flex items-center gap-2">
        <span role="img" aria-label="Wallet" className="text-lg leading-none">🔓</span>
        Login
      </Button>
    );
  }
  
  const initials = user.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2 py-1 hover:bg-muted transition-colors"
        aria-haspopup="menu" aria-expanded={menuOpen}
      >
        {user.profile_image_url ? (
          <img src={user.profile_image_url} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center text-sm">
            {initials}
          </div>
        )}
        <span className="text-sm text-foreground/80 font-medium">{user.username}</span>
        <ChevronDown className="w-4 h-4 text-foreground/70" />
      </button>

      {menuOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
          <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60" onClick={() => setMenuOpen(false)}>
            <ProfileIcon className="w-4 h-4" />
            Profile
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 text-red-500" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};


// ==========================================================
// PÁGINA EXPLORE (Usa a API pública)
// ==========================================================
type Collaborator = {
    username: string;
    address: string;
    role: 'owner' | 'collaborator';
};

type Repository = {
  id: string;
  name: string;
  owner_address: string;
  created_at: string;
  description: string;
  forks: number;
  stars: number;
  collaborators: Collaborator[];
};

const Explore: React.FC = () => {
  const [repositories, setRepositories] = React.useState<Repository[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPublicRepositories = async () => {
      try {
        // CORREÇÃO: Usando a instância PÚBLICA do axios
        const response = await publicApi.get("/repos/");
        setRepositories(response.data);
      } catch (err) {
        setError("Não foi possível carregar os repositórios públicos.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicRepositories();
  }, []);

  const getAuthorName = (repo: Repository) => {
    // Seu backend salva o username nos colaboradores, vamos usá-lo!
    const owner = repo.collaborators?.find(c => c.role === 'owner');
    if (owner && owner.username) {
        return owner.username;
    }
    // Plano B: mostrar o endereço formatado se não encontrar o username
    return `${repo.owner_address.slice(0, 6)}...${repo.owner_address.slice(-4)}`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Lembrete: Mova o AuthWidget para dentro da sua Navbar real */}
      <Navbar> 
        <AuthWidget />
      </Navbar>

      <section className="bg-gray-100 dark:bg-gray-900 py-12">
        {/* ... (Seu banner continua aqui) ... */}
         <div className="max-w-7xl mx-auto px-6 text-center">
           <h1 className="text-4xl font-bold text-foreground mb-4">Explore Scientific Repositories</h1>
           <p className="text-xl text-gray-500 max-w-4xl mx-auto">
             Discover, fork, and support research from a global community of scientists.
           </p>
         </div>
      </section>

      <section className="py-8 bg-card border-b border-border">
        {/* ... (Sua UI de busca e filtros continua aqui) ... */}
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Search repositories by name, topic, or author..." className="input-professional pl-12" />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="btn-ghost flex items-center gap-2"><Filter className="w-4 h-4" />Filter</button>
                    <select className="input-professional max-w-48"><option>Sort by: Most Stars</option></select>
                </div>
            </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 bg-red-50 border border-red-200 rounded-lg p-8">
                <h3 className="font-bold text-lg mb-2">Failed to load content</h3>
                <p>{error}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {repositories.map((repo) => (
                <div key={repo.id} className="card-professional hover:border-primary/50 transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link to={`/repository/${repo.id}`} className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
                            {repo.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2" title={repo.owner_address}>
                              <UserIcon className="w-4 h-4" />
                              {/* MELHORIA: Exibe o username do autor! */}
                              <span className="font-medium">{getAuthorName(repo)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <time dateTime={repo.created_at}>{format(new Date(repo.created_at), "MMM dd, yyyy")}</time>
                            </div>
                          </div>
                        </div>
                        {/* <StatusTag status={"validated"} /> */}
                      </div>

                      <p className="text-gray-600 leading-relaxed mb-4">{repo.description}</p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2 hover:text-primary cursor-pointer">
                          <Star className="w-4 h-4" />
                          <span>{repo.stars} stars</span>
                        </div>
                        <div className="flex items-center gap-2 hover:text-primary cursor-pointer">
                          <GitFork className="w-4 h-4" />
                          <span>{repo.forks} forks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to={`/repository/${repo.id}`} className="btn-secondary">View Details</Link>
                      <button className="btn-primary">Fork</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Explore;
