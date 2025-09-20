// src/components/layout/Navbar.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Menu as MenuIcon,
  Home,
  Star,
  BookOpen,
  Search,
  ChevronDown,
  LogOut,
  User as ProfileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

// Wagmi (MetaMask connection)
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";

/* =======================================================
   API CONFIG (axios with JWT)
======================================================= */
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // 👈 backend base
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =======================================================
   Logo Animation
======================================================= */
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
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
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
          <circle
            cx="28"
            cy="46"
            r="3"
            fill="white"
            style={{ animation: "nh-bubble 1.6s infinite" }}
          />
          <circle
            cx="36"
            cy="50"
            r="2"
            fill="white"
            style={{ animation: "nh-bubble 1.8s .2s infinite" }}
          />
          <circle
            cx="32"
            cy="44"
            r="2.5"
            fill="white"
            style={{ animation: "nh-bubble 1.7s .1s infinite" }}
          />
        </g>
        <rect
          x="28"
          y="6"
          width="8"
          height="6"
          rx="1"
          fill="hsl(var(--primary))"
        />
      </svg>
    </div>
  );
};

/* =======================================================
   Hamburger Menu
======================================================= */
const useOnClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) => {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
};

const HamburgerMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useOnClickOutside(ref, () => setOpen(false));

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" className="p-2" onClick={() => setOpen((v) => !v)}>
        <MenuIcon className="w-5 h-5" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-20">
          <button onClick={() => go("/explore")} className="px-3 py-2 flex gap-2 hover:bg-muted/60">
            <Home className="w-4 h-4" /> Home
          </button>
          <button onClick={() => go("/MyRepository")} className="px-3 py-2 flex gap-2 hover:bg-muted/60">
            <BookOpen className="w-4 h-4" /> My Repositories
          </button>
          <button onClick={() => go("/favorites")} className="px-3 py-2 flex gap-2 hover:bg-muted/60">
            <Star className="w-4 h-4" /> Favorites
          </button>
        </div>
      )}
    </div>
  );
};

/* =======================================================
   AuthButton (Login + Avatar)
======================================================= */
type UserProfile = {
  username: string;
  profile_image_url?: string;
  address: string; // ✅ corrected
};

const AuthButton: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [statusText, setStatusText] = useState("Login with MetaMask");
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/users/me"); // ✅ ensure backend route
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  const handleAuthentication = useCallback(
    async (walletAddress: string) => {
      setIsLoading(true);
      try {
        const nonceRes = await api.post("/auth/nonce", { address: walletAddress });
        const { nonce } = nonceRes.data;
        const signature = await signMessageAsync({ message: nonce });
        const loginRes = await api.post("/auth/login", { address: walletAddress, signature });
        const { access_token } = loginRes.data;
        localStorage.setItem("jwt_token", access_token);
        await fetchProfile();
        navigate("/explore");
      } catch (err) {
        console.error("Login error:", err);
        setStatusText("Try again");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile, navigate, signMessageAsync]
  );

  useEffect(() => {
    if (isConnected && address && localStorage.getItem("jwt_token")) {
      fetchProfile();
    }
  }, [isConnected, address, fetchProfile]);

  const handleConnectClick = () => {
    if (isConnected && address) {
      handleAuthentication(address);
    } else {
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) connect({ connector: injectedConnector });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    setMenuOpen(false);
    navigate("/explore");
  };

  if (isLoading) {
    return (
      <button disabled className="btn-primary px-4 py-2">
        {statusText}
      </button>
    );
  }

  if (!user) {
    return (
      <button onClick={handleConnectClick} className="btn-primary px-4 py-2">
        {statusText}
      </button>
    );
  }

  const initials = user.username?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 hover:bg-muted"
      >
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
            {initials}
          </div>
        )}
        <span className="text-sm">{user.username}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded shadow-lg z-10">
          <Link
            to={`/profile/${user.address}`} // ✅ fixed
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
            onClick={() => setMenuOpen(false)}
          >
            <ProfileIcon className="w-4 h-4" /> Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted/60"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/* =======================================================
   Main Navbar
======================================================= */
type NavbarProps = { currentTitle?: string };

export const Navbar: React.FC<NavbarProps> = ({ currentTitle }) => {
  const location = useLocation();
  const title = currentTitle ?? location.pathname;

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
        {/* Left */}
        <div className="flex items-center gap-2">
          <HamburgerMenu />
          <Link to="/explore" className="flex items-center gap-2">
            <FlaskLogo />
          </Link>
        </div>

        {/* Center */}
        <div className="flex-1 flex items-center justify-center gap-4 min-w-0">
          <span className="text-sm md:text-base font-medium truncate">{title}</span>
          <div className="hidden md:flex items-center relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type / to search"
              className="w-full rounded-md border pl-9 pr-10 py-1.5 text-sm"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] border px-1.5 rounded">
              /
            </kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link to="/editor" className="btn-primary hidden sm:inline-flex">
            Create
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
