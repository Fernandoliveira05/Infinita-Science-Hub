import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Illustration */}
      <div className="flex-1 bg-gradient-to-br from-primary/10 via-blue/5 to-primary/5 flex items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="relative mb-8">
            {/* Animated Test Tube */}
            <div className="w-48 h-64 mx-auto relative">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 rotate-12">
                {/* Test tube container */}
                <div className="w-16 h-48 bg-white/20 backdrop-blur-sm border-2 border-primary/30 rounded-full rounded-t-lg relative overflow-hidden">
                  {/* Bubbling liquid */}
                  <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-primary to-primary-light animate-pulse">
                    {/* Bubbles */}
                    <div className="absolute bottom-4 left-3 w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="absolute bottom-12 left-5 w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    <div className="absolute bottom-6 right-3 w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  </div>
                </div>
                {/* Test tube cap */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-gray-300 rounded-lg shadow-md"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Science
          </h2>
          <p className="text-gray-500 text-lg">
            Where innovation meets validation in the heart of Infinita City
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-12 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="card-professional">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Infinita Science Hub
              </h1>
              <p className="text-gray-500">
                Access your research workspace with secure blockchain authentication
              </p>
            </div>

            <div className="space-y-6">
              <button className="w-full btn-primary flex items-center justify-center gap-3 py-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.483 2.294C2.666 2.628 2.05 3.41 2.05 4.337v15.326c0 .927.615 1.709 1.432 2.043l7.517-10.85L3.483 2.294z"/>
                  <path d="M21.949 4.337c0-.927-.615-1.709-1.432-2.043L13 10.856l7.517 10.85c.817-.334 1.432-1.116 1.432-2.043V4.337z"/>
                </svg>
                Login with MetaMask
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have MetaMask?{" "}
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-hover font-medium"
                  >
                    Install it here
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
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ← Back to Platform Info
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;