import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Importações para conectar com a carteira
import { WagmiConfig, createConfig, useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { http } from "viem";

// --- Configuração do Wagmi (Conexão com a carteira) ---
const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: { [mainnet.id]: http() },
  autoConnect: true,
});

// --- Configuração do Axios (Conexão com seu Backend) ---
// O endpoint base para todas as chamadas à API
const api = axios.create({
  baseURL: "http://localhost:55403/api/auth", // Aponta diretamente para suas rotas de autenticação
});

// ==========================================================
// Componente de Lógica e UI do Botão de Login
// ==========================================================
const AuthButton = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("Login with MetaMask");
  const [isLoading, setIsLoading] = useState(false);

  // Hooks do wagmi para interagir com a carteira
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const handleAuthentication = useCallback(async (walletAddress) => {
    setError("");
    setIsLoading(true);

    try {
      // 1. Pedir o nonce ao backend
      setStatusText("Gerando mensagem de segurança...");
      const nonceRes = await api.post("/nonce", { address: walletAddress });
      const { nonce } = nonceRes.data;
      if (!nonce) throw new Error("Não foi possível obter o nonce do servidor.");

      // 2. Pedir para o usuário assinar o nonce
      setStatusText("Aguardando assinatura na carteira...");
      const signature = await signMessageAsync({ message: nonce });

      // 3. Enviar endereço e assinatura para o login
      setStatusText("Verificando credenciais...");
      const loginRes = await api.post("/login", {
        address: walletAddress,
        signature: signature,
      });

      const { access_token } = loginRes.data;
      if (!access_token) throw new Error("Token de acesso não recebido.");

      // 4. Salvar o token e redirecionar
      localStorage.setItem("jwt_token", access_token);
      setStatusText("Login bem-sucedido!");
      
      // Redireciona para uma página protegida após o login
      // Mude "/dashboard" para a rota que desejar
      navigate("/explore"); 

    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || "Ocorreu um erro inesperado.";
      setError(errorMessage);
      console.error("Erro de autenticação:", err);
      setIsLoading(false);
      setStatusText("Tentar novamente");
    }
  }, [navigate, signMessageAsync]);

  // Efeito que dispara a autenticação assim que a carteira é conectada
  useEffect(() => {
    if (isConnected && address && !localStorage.getItem('jwt_token')) {
      handleAuthentication(address);
    }
  }, [isConnected, address, handleAuthentication]);

  const handleConnectClick = () => {
    // Se o usuário já estiver conectado, mas sem token, tenta autenticar
    if (isConnected && address) {
        handleAuthentication(address);
    } else {
        // Se não, inicia o processo de conexão da carteira
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
            connect({ connector: injectedConnector });
        } else {
            setError("MetaMask não detectado. Por favor, instale a extensão.");
        }
    }
  };
  
  return (
    <div className="w-full space-y-3">
        <button 
            onClick={handleConnectClick} 
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-3 py-4 disabled:opacity-50"
        >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.483 2.294C2.666 2.628 2.05 3.41 2.05 4.337v15.326c0 .927.615 1.709 1.432 2.043l7.517-10.85L3.483 2.294z"/>
              <path d="M21.949 4.337c0-.927-.615-1.709-1.432-2.043L13 10.856l7.517 10.85c.817-.334 1.432-1.116 1.432-2.043V4.337z"/>
            </svg>
            {isLoading ? statusText : "Login with MetaMask"}
        </button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
};


// ==========================================================
// Componente da Página de Login Completa
// ==========================================================
const Login = () => {
  return (
    // O WagmiConfig é o "provedor" que permite que os componentes filhos usem os hooks de carteira
    <WagmiConfig config={wagmiConfig}>
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Illustration */}
        <div className="flex-1 bg-gradient-to-br from-primary/10 via-blue/5 to-primary/5 hidden lg:flex items-center justify-center p-12">
            <div className="max-w-md text-center">
                <div className="relative mb-8">
                    <div className="w-48 h-64 mx-auto relative">
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 rotate-12">
                        <div className="w-16 h-48 bg-white/20 backdrop-blur-sm border-2 border-primary/30 rounded-full rounded-t-lg relative overflow-hidden">
                        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-primary to-primary-light animate-pulse">
                            <div className="absolute bottom-4 left-3 w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                            <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-gray-300 rounded-lg shadow-md"></div>
                    </div>
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Welcome to Science</h2>
                <p className="text-gray-500 text-lg">Where innovation meets validation in the heart of Infinita City</p>
            </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md">
            <div className="card-professional">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Infinita Science Hub</h1>
                <p className="text-gray-500">Access your research workspace with secure blockchain authentication</p>
              </div>

              <div className="space-y-6">
                
                {/* O componente do botão com toda a lógica foi inserido aqui */}
                <AuthButton />

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Don't have a wallet?{" "}
                    <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover font-medium">
                      Install MetaMask here
                    </a>
                  </p>
                </div>

                <div className="border-t pt-6">
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    By connecting your wallet, you agree to participate in the Infinita City 
                    scientific research ecosystem. Your research will be secured on blockchain.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors">
                ← Back to landing page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </WagmiConfig>
  );
};

export default Login;