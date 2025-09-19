// src/components/layout/AuthWidget.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, User as ProfileIcon } from "lucide-react";
import { MetaMaskButton } from "@metamask/sdk-react-ui";
import { useSDK } from "@metamask/sdk-react";

export const AuthWidget: React.FC = () => {
  const { account, connected, sdk } = useSDK(); // estado de conexão oficial do SDK
  const [menuOpen, setMenuOpen] = React.useState(false);

  // botão oficial já cuida do fluxo de conexão;
  // se quiser conectar programaticamente:
  const handleSignOut = async () => {
    // SDK não “desloga” a extensão, mas você pode limpar seu estado local
    // e/ou usar contas desconectadas no backend.
    setMenuOpen(false);
    // aqui entraria sua limpeza de sessão (ex.: useAuthStore().logout())
  };

  if (!connected || !account) {
    // Botão oficial MetaMask
    return (
      <div className="flex">
        <MetaMaskButton theme="light" color="white" />
      </div>
    );
  }

  const initials = `${account.slice(2, 4)}${account.slice(-2)}`.toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2 py-1"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={account}
      >
        <div className="w-8 h-8 rounded-full bg-muted text-[10px] font-semibold flex items-center justify-center">
          {initials}
        </div>
        <span className="text-sm text-foreground/80">
          {account.slice(0, 6)}…{account.slice(-4)}
        </span>
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
