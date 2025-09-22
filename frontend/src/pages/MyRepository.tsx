import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Adicionado para navegação
import axios from "axios";
import { format } from "date-fns";
import { Loader2, AlertTriangle, Star } from "lucide-react";
import { Navbar } from "../components/layouts/Navbar";
import { AuthWidget } from "./Explore";

// ==========================================================
// CLIENTE API AUTENTICADO
// ==========================================================
// É uma boa prática centralizar a configuração do Axios para não repetir a lógica de headers.
const authenticatedApi = axios.create({
  baseURL: "http://localhost:55403/api",
});

// Este "interceptor" adiciona o token JWT a todas as chamadas feitas com `authenticatedApi`
authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token"); // O token salvo no login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================================
// TIPOS DE DADOS
// ==========================================================
// Interface ajustada para corresponder aos dados do seu backend
interface Repo {
  id: string;
  name: string;
  description: string;
  stars: number;
  created_at: string;
  // O campo 'language' não parece vir do seu backend, então vamos tratá-lo como opcional.
  language?: string;
}

const MyRepository: React.FC = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyRepos = async () => {
      try {
        // MELHORIA: Usando o cliente API centralizado
        // CORREÇÃO: A URL foi ajustada para `/repositories/mine`
        const response = await authenticatedApi.get("/repos/mine");
        setRepos(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError("Sessão inválida ou expirada. Por favor, faça o login novamente.");
        } else {
          setError(err.response?.data?.detail || "Erro ao carregar seus repositórios");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyRepos();
  }, []); // O array vazio [] garante que a busca só aconteça uma vez

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-8 text-red-600 bg-red-50 p-6 rounded-lg border border-red-200">
        <AlertTriangle className="mx-auto w-12 h-12 mb-4" />
        <h2 className="font-bold text-lg">Ocorreu um erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        <Navbar>
            <AuthWidget />
        </Navbar>
        <div className="max-w-5xl mx-auto p-4"></div>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Meus Repositórios</h1>
      
      {repos.length === 0 ? (
        <div className="text-center py-16 px-6 bg-card border rounded-lg">
          <h2 className="text-xl font-semibold text-foreground">Você ainda não criou nenhum repositório.</h2>
          <p className="text-muted-foreground mt-2 mb-6">Comece uma nova pesquisa para vê-la listada aqui.</p>
          <Link to="/editor" className="btn-primary">
            Criar Nova Pesquisa
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <Link to={`/repository/${repo.id}`} key={repo.id} className="block card-professional hover:border-primary/50 transition-all duration-200">
                <div className="flex flex-col h-full">
                    <h2 className="font-semibold text-lg mb-1 text-foreground">{repo.name}</h2>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      {repo.description || "Sem descrição"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t">
                      <span>{repo.language || "N/A"}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars}</span>
                      <span>{format(new Date(repo.created_at), "dd/MM/yyyy")}</span>
                    </div>
                </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRepository;