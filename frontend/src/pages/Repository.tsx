// src/pages/Repository.tsx
import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  GitFork,
  Star,
  Download,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Navbar } from "../components/layouts/Navbar";
import { AuthWidget } from "./Explore";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ProofNode } from "@/components/editor/ProofNode";

// ================= API =================
const publicApi = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

const authenticatedApi = axios.create({ baseURL: "http://127.0.0.1:8000/api" });
authenticatedApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

// ================ Types ================
type Collaborator = { username: string; address: string; role: "owner" | "collaborator" };
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
  type: "text" | "image" | "video" | "audio" | "reference" | "print";
  status: "in_review" | "approved" | "rejected";
  created_at?: string;
  position?: { x: number; y: number };
  aiSummary?: string;
  content?: any;
};

// ========== Helpers ==========
const norm = (s?: string | null) => (s ? s.trim().toLowerCase() : "");

function getAddressFromLocalStorage(): string | null {
  // chaves comuns
  const direct =
    localStorage.getItem("user_address") ||
    localStorage.getItem("address") ||
    localStorage.getItem("wallet") ||
    null;
  if (direct) return direct;

  // objeto serializado
  const jsonKeys = ["auth_user", "user", "profile"];
  for (const k of jsonKeys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj?.address) return String(obj.address);
      if (obj?.user?.address) return String(obj.user.address);
      if (obj?.walletAddress) return String(obj.walletAddress);
    } catch {}
  }

  // JWT payload
  const token = localStorage.getItem("jwt_token");
  if (token && token.includes(".")) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.address) return String(payload.address);
      if (payload?.sub && typeof payload.sub === "string" && payload.sub.startsWith("0x"))
        return payload.sub;
    } catch {}
  }

  return null;
}

// ========== Blocks preview ==========
const nodeTypes = { proofBlock: ProofNode };
const START_X = 40;
const START_Y = 110;
const H_SPACING = 360;

const BlocksTabContent: React.FC<{ repoId: string }> = ({ repoId }) => {
  const [blocks, setBlocks] = useState<BlockData[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await publicApi.get(`/blocks/repo/${repoId}`);
        if (!alive) return;
        setBlocks(res.data || []);
      } catch {
        setBlocks([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [repoId]);

  const ordered = useMemo(() => {
    if (!blocks) return [];
    return [...blocks].sort((a, b) => {
      const ca = a.created_at ?? "";
      const cb = b.created_at ?? "";
      if (ca && cb && ca !== cb) return ca < cb ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
  }, [blocks]);

  const nodes: Node[] = useMemo(() => {
    const arr: Node[] = [];
    let x = START_X;
    const y = START_Y;
    for (const b of ordered) {
      arr.push({
        id: b.id,
        type: "proofBlock",
        position: { x, y },
        data: {
          id: b.id,
          title: b.title,
          description: b.description,
          aiSummary: b.aiSummary,
          type: b.type,
          status: b.status ?? "in_review",
        },
        draggable: false,
        selectable: false,
      });
      x += H_SPACING;
    }
    return arr;
  }, [ordered]);

  const edges: Edge[] = useMemo(() => {
    const arr: Edge[] = [];
    for (let i = 0; i < ordered.length - 1; i++) {
      const a = ordered[i];
      const b = ordered[i + 1];
      arr.push({
        id: `e${a.id}-${b.id}`,
        source: a.id,
        target: b.id,
        type: "smoothstep",
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      });
    }
    return arr;
  }, [ordered]);

  if (loading) {
    return (
      <div className="h-[320px] flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading blocks…
      </div>
    );
  }

  if (!blocks || blocks.length === 0) {
    return (
      <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
        No blocks yet for this repository.
      </div>
    );
  }

  return (
    <div className="relative h-[360px] rounded-lg border border-border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        panOnScroll
        className="bg-background"
      >
        <Background
          color="hsl(var(--muted-foreground))"
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap pannable zoomable />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

// ========== Main ==========
const Repository = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [repository, setRepository] = useState<RepositoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("blocks");

  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [isStarring, setIsStarring] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [addressLoaded, setAddressLoaded] = useState(false);

  // Carrega endereço do usuário (vários fallbacks) e só então deixa renderizar o header de ações
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1) LocalStorage / JWT
      const fromLS = getAddressFromLocalStorage();
      if (!cancelled && fromLS) {
        setCurrentAddress(fromLS);
        setAddressLoaded(true);
        return;
      }
      // 2) /auth/me (se existir)
      const token = localStorage.getItem("jwt_token");
      if (token) {
        try {
          const me = await authenticatedApi.get("/auth/me");
          if (!cancelled && me?.data?.address) {
            setCurrentAddress(me.data.address);
          }
        } catch {
          // ok se não existir
        }
      }
      if (!cancelled) setAddressLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // repo + estrelas
  useEffect(() => {
    if (!id) return;

    const fetchRepositoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await publicApi.get(`/repos/${id}`);
        setRepository(res.data);
        setStarCount(res.data.stars);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load repository.");
      } finally {
        setIsLoading(false);
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

  // === dono? ===
  const isOwner = useMemo(() => {
    if (!repository || !currentAddress) return false;
    const me = norm(currentAddress);
    const ownerField = norm(repository.owner_address);

    // match direto com owner_address
    if (me && ownerField && me === ownerField) return true;

    // ou se estiver listado nos colaboradores como 'owner'
    if (Array.isArray(repository.collaborators)) {
      const hasOwnerRole = repository.collaborators.some(
        (c) => c.role === "owner" && norm(c.address) === me
      );
      if (hasOwnerRole) return true;
    }
    return false;
  }, [repository, currentAddress]);

  const handleStarClick = async () => {
    if (!localStorage.getItem("jwt_token")) {
      navigate("/login");
      return;
    }
    if (!id) return;

    setIsStarring(true);
    try {
      if (isStarred) {
        await authenticatedApi.delete(`/repos/${id}/star`);
        setStarCount((prev) => Math.max(prev - 1, 0));
        setIsStarred(false);
      } else {
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

  const handleEditClick = () => {
    if (!repository) return;
    if (!localStorage.getItem("jwt_token")) {
      navigate("/login");
      return;
    }
    navigate(`/editor/${repository.id}`);
  };

  const handleDeleteRepo = async () => {
    if (!repository || !id) return;
    if (!localStorage.getItem("jwt_token")) {
      navigate("/login");
      return;
    }
    const ok = window.confirm(
      `Delete repository “${repository.name}”? This action cannot be undone.`
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      await authenticatedApi.delete(`/repos/${id}`);
      navigate("/explore");
    } catch (err: any) {
      console.error("Failed to delete repository:", err);
      alert(
        err?.response?.data?.detail ||
          "Failed to delete repository. You must be the owner."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar>
          <AuthWidget />
        </Navbar>
        <div className="max-w-7xl mx-auto px-6 py-20 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading repository…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar>
          <AuthWidget />
        </Navbar>
        <div className="max-w-7xl mx-auto px-6 py-20 flex items-center gap-3 text-rose-600">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      </div>
    );
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

        {/* Header */}
        <div className="card-professional mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <p className="text-3xl font-extrabold text-foreground leading-relaxed mb-6">
                {repository.name}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {repository.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
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
              {/* Mostra botões de dono apenas depois que resolvermos o address (evita piscar) */}
              {addressLoaded && isOwner && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Edit Repository
                  </button>

                  <button
                    onClick={handleDeleteRepo}
                    disabled={isDeleting}
                    className="btn-ghost border border-rose-300 text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-2"
                    title="Delete repository"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isDeleting ? "Deleting…" : "Delete Repository"}
                  </button>
                </>
              )}

              <button className="btn-secondary flex items-center justify-center gap-2">
                <GitFork className="w-4 h-4" /> Fork Repository
              </button>

              <button
                onClick={handleStarClick}
                disabled={isStarring}
                className={`btn-ghost flex items-center justify-center gap-2 ${
                  isStarred ? "bg-amber-100 text-amber-800 border-amber-200" : ""
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

          <div className="min-h-96">
            {activeTab === "blocks" && <BlocksTabContent repoId={repository.id} />}
            {activeTab === "references" && <div>References Content (to be integrated)</div>}
            {activeTab === "license" && <div>License Content (to be integrated)</div>}
            {activeTab === "discussions" && <div>Discussions Content (to be integrated)</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repository;
