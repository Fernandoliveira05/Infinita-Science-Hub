// src/components/layout/Navbar.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Menu as MenuIcon,
  Home,
  Star,
  BookOpen,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthWidget } from "../layouts/AuthWidget";

/* ====================== Logo: Flask borbulhando ======================= */
const useInjectFlaskKeyframes = () => {
  React.useEffect(() => {
    const ID = "navbar-flask-keyframes";
    if (typeof document === "undefined" || document.getElementById(ID)) return;
    const style = document.createElement("style");
    style.id = ID;
    style.textContent = `
@keyframes nh-bubble {
  0%   { transform: translateY(0) scale(1);   opacity:.95; }
  50%  { transform: translateY(-3px) scale(1.05); opacity:.75; }
  100% { transform: translateY(0) scale(1);  opacity:.95; }
}
@keyframes nh-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-2px); }
}`;
    document.head.appendChild(style);
  }, []);
};

const FlaskLogo: React.FC<{ size?: number }> = ({ size = 36 }) => {
  useInjectFlaskKeyframes();
  return (
    <div style={{ animation: "nh-bob 2.2s ease-in-out infinite" }}>
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true">
        <defs>
          <clipPath id="flaskNavbarBody">
            <path d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z" />
          </clipPath>
        </defs>
        <path
          d="M24 8h16v4l-4 8v8l10 16c2 3-1 8-6 8H24c-5 0-8-5-6-8l10-16v-8l-4-8V8Z"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          fill="white"
        />
        <g clipPath="url(#flaskNavbarBody)">
          <path d="M12 40h40v16H12z" fill="hsl(var(--primary))" />
          <circle cx="28" cy="46" r="3" fill="white" style={{ animation: "nh-bubble 1.6s infinite" }} />
          <circle cx="36" cy="50" r="2" fill="white" style={{ animation: "nh-bubble 1.8s .2s infinite" }} />
          <circle cx="32" cy="44" r="2.5" fill="white" style={{ animation: "nh-bubble 1.7s .1s infinite" }} />
        </g>
        <rect x="28" y="6" width="8" height="6" rx="1" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
};

/* ====================== Hook: clique fora ======================= */
const useOnClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

/* ====================== Hamburger Menu ======================= */
const HamburgerMenu: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        className="p-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => go("/explore")}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => go("/my-repositories")}
          >
            <BookOpen className="w-4 h-4" />
            My Repositories
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => go("/favorites")}
          >
            <Star className="w-4 h-4" />
            Favorites
          </button>
        </div>
      )}
    </div>
  );
};

/* ====================== Título de contexto ======================= */
const getTitleFromPath = (path: string) => {
  if (path === "/" || path.startsWith("/explore")) return "Explore";
  if (path.startsWith("/repository/")) return "Repository";
  if (path.startsWith("/my-repositories")) return "My Repositories";
  if (path.startsWith("/favorites")) return "Favorites";
  if (path.startsWith("/editor")) return "Create Repository";
  if (path.startsWith("/editor")) return "Research Editor";
  return "Infinita Science Hub";
};

/* ====================== Keyframes: botão brilhando ======================= */
const useInjectCreateButtonKeyframes = () => {
  React.useEffect(() => {
    const ID = "create-button-keyframes";
    if (typeof document === "undefined" || document.getElementById(ID)) return;
    const style = document.createElement("style");
    style.id = ID;
    style.textContent = `
@keyframes nh-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes nh-glow {
  0%,100% { box-shadow: 0 0 4px hsl(var(--primary)/0.6), 0 0 8px hsl(var(--primary)/0.4); }
  50%     { box-shadow: 0 0 8px hsl(var(--primary)/0.8), 0 0 16px hsl(var(--primary)/0.6); }
}
.create-glow {
  position: relative;
  background: linear-gradient(
    120deg,
    hsl(var(--primary)) 0%,
    hsl(var(--primary)/0.6) 20%,
    hsl(var(--primary)) 40%
  );
  background-size: 200% 100%;
  animation: nh-shimmer 3s linear infinite, nh-glow 2s ease-in-out infinite;
  color: white !important;
}
`;
    document.head.appendChild(style);
  }, []);
};

type NavbarProps = { currentTitle?: string };

export const Navbar: React.FC<NavbarProps> = ({ currentTitle }) => {
  const location = useLocation();
  const title = currentTitle ?? getTitleFromPath(location.pathname);

  // injeta animação do botão
  useInjectCreateButtonKeyframes();

  // Atalho de teclado "/" foca a busca (UX GitHub-like)
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="bg-card border-b border-border">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2">
          <HamburgerMenu />
          <Link to="/explore" className="flex items-center gap-2">
            <FlaskLogo />
          </Link>
        </div>

        {/* Center: título + busca */}
        <div className="flex-1 flex items-center justify-center gap-4 min-w-0">
          <span className="text-sm md:text-base font-medium text-foreground truncate">
            {title}
          </span>
          <div className="hidden md:flex items-center relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type / to search"
              className="w-full rounded-md border border-border bg-background pl-9 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Search"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] px-1.5 py-0.5 rounded border border-border bg-card text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        {/* Right: ações */}
        <div className="flex items-center gap-3">
          <Link to="/editor" className="btn-primary hidden sm:inline-flex create-glow">
            Create
          </Link>
          <Button variant="ghost" className="hidden sm:inline-flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline">Settings</span>
          </Button>
          <AuthWidget />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
