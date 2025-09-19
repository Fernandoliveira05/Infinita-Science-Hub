// src/pages/Explore.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/layouts/Navbar";
import {
  Search,
  Filter,
  GitFork,
  DollarSign,
  Clock,
  User as UserIcon,
  Hash,
  Settings,
  ChevronDown,
  LogOut,
  User as ProfileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------- Flask borbulhando (Header) -------------------- */
const useInjectFlaskKeyframes = () => {
  React.useEffect(() => {
    const ID = "header-flask-keyframes";
    if (typeof document === "undefined" || document.getElementById(ID)) return;
    const style = document.createElement("style");
    style.id = ID;
    style.textContent = `
@keyframes ih-bubble {
  0%   { transform: translateY(0) scale(1);   opacity: .95; }
  50%  { transform: translateY(-3px) scale(1.05); opacity: .75; }
  100% { transform: translateY(0) scale(1);  opacity: .95; }
}
@keyframes ih-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-2px); }
}
    `;
    document.head.appendChild(style);
  }, []);
};

const FlaskHeaderIcon: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => {
  useInjectFlaskKeyframes();
  const s = { width: size, height: size } as React.CSSProperties;
  return (
    <div className={className} style={{ ...s, animation: "ih-bob 2.2s ease-in-out infinite" }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <defs>
          <clipPath id="flaskHeaderBody">
            <path d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z" />
          </clipPath>
        </defs>
        {/* contorno */}
        <path
          d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          fill="white"
        />
        {/* líquido */}
        <g clipPath="url(#flaskHeaderBody)">
          <path d="M12 40h40v16H12z" fill="hsl(var(--primary))" />
          {/* bolhas */}
          <circle cx="28" cy="46" r="3" fill="white" style={{ animation: "ih-bubble 1.6s ease-in-out infinite" }} />
          <circle cx="36" cy="50" r="2" fill="white" style={{ animation: "ih-bubble 1.8s .2s ease-in-out infinite" }} />
          <circle cx="32" cy="44" r="2.5" fill="white" style={{ animation: "ih-bubble 1.7s .1s ease-in-out infinite" }} />
        </g>
        {/* gargalo */}
        <rect x="28" y="6" width="8" height="6" rx="1" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
};

/* -------------------- Auth UI (login/avatar) -------------------- */
/* Integração:
   - Troque 'user' por algo vindo do seu auth store (ex.: useAuthStore()).
   - Troque handleConnect por loginWithMetamask()
   - Troque handleSignOut por logout()
*/
type MockUser = { name: string; photoUrl?: string };

const AuthWidget: React.FC = () => {
  // MOCK: simule o estado de login aqui
  const [user, setUser] = React.useState<MockUser | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleConnect = async () => {
    // TODO: integrar com MetaMask real no front
    // Exemplo: await loginWithMetamask();
    setUser({ name: "Ada Lovelace" });
  };

  const handleSignOut = async () => {
    // TODO: integrate logout
    setUser(null);
    setMenuOpen(false);
  };

  if (!user) {
    return (
      <Button onClick={handleConnect} className="flex items-center gap-2">
        <span role="img" aria-label="MetaMask" className="text-lg leading-none">🦊</span>
        Connect with MetaMask
      </Button>
    );
  }

  const initials =
    user.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2 py-1"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted text-xs font-semibold flex items-center justify-center">
            {initials}
          </div>
        )}
        <span className="text-sm text-foreground/80">{user.name}</span>
        <ChevronDown className="w-4 h-4 text-foreground/70" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10"
        >
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => setMenuOpen(false)}
          >
            <ProfileIcon className="w-4 h-4" />
            Profile
          </Link>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/* -------------------- Mock data (explore) -------------------- */
const mockRepositories = [
  {
    id: "1",
    title: "Quantum Entanglement in Biological Systems",
    author: "Dr. Sarah Chen",
    date: "2024-03-15",
    hash: "0x1a2b3c4d",
    status: "validated",
    forks: 23,
    donations: 1.2,
    description:
      "Investigating quantum coherence in photosynthetic complexes using advanced spectroscopy techniques.",
  },
  {
    id: "2",
    title: "CRISPR-Cas9 Optimization for Neural Tissue",
    author: "Prof. Miguel Rodriguez",
    date: "2024-03-12",
    hash: "0x2b3c4d5e",
    status: "in-review",
    forks: 8,
    donations: 0.7,
    description:
      "Novel approaches to gene editing in brain tissue with reduced off-target effects.",
  },
  {
    id: "3",
    title: "Machine Learning for Protein Folding",
    author: "Alex Kumar",
    date: "2024-03-10",
    hash: "0x3c4d5e6f",
    status: "validated",
    forks: 45,
    donations: 2.8,
    description:
      "Deep learning models predicting protein structures with unprecedented accuracy.",
  },
  {
    id: "4",
    title: "Renewable Energy Storage Solutions",
    author: "Dr. Emma Thompson",
    date: "2024-03-08",
    hash: "0x4d5e6f7g",
    status: "free",
    forks: 34,
    donations: 1.9,
    description:
      "Novel battery technologies using bio-inspired materials for sustainable energy.",
  },
];

/* -------------------- Status tag -------------------- */
const StatusTag: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "validated":
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Validated
        </span>
      );
    case "in-review":
      return (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          In Review
        </span>
      );
    case "free":
      return (
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
          Free License
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
          Unknown
        </span>
      );
  }
};

/* -------------------- Página Explore -------------------- */
const Explore: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Banner */}
      <section className="bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Explore Scientific Repositories</h1>
          <p className="text-xl text-gray-500 max-w-4xl mx-auto">
            Explore scientific repositories published by the community. Fork under license or support researchers directly.
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search repositories, authors, or topics..."
                className="input-professional pl-12"
                aria-label="Search repositories"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button className="btn-ghost flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <select className="input-professional max-w-48" aria-label="Sort repositories">
                <option>Sort by relevance</option>
                <option>Most recent</option>
                <option>Most forked</option>
                <option>Highest funded</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Repository Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-6">
            {mockRepositories.map((repo) => (
              <div
                key={repo.id}
                className="card-professional hover:scale-[1.01] transition-all duration-200"
                role="article"
                aria-labelledby={`repo-title-${repo.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          to={`/repository/${repo.id}`}
                          id={`repo-title-${repo.id}`}
                          className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {repo.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>{repo.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <time dateTime={repo.date}>{repo.date}</time>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono">{repo.hash}</span>
                          </div>
                        </div>
                      </div>
                      <StatusTag status={repo.status} />
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-4">{repo.description}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <GitFork className="w-4 h-4" />
                        <span>{repo.forks} forks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{repo.donations} ETH donated</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={`/repository/${repo.id}`} className="btn-secondary">
                      View Details
                    </Link>
                    <button className="btn-primary">Fork & License</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="btn-secondary px-8">Load More Repositories</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Explore;
