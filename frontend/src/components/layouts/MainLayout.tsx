import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const MainLayout = ({ children, showNav = true }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNav && (
        <header className="bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">IS</span>
                </div>
                <span className="font-bold text-xl text-foreground">Infinita Science Hub</span>
              </Link>
              
              <nav className="flex items-center space-x-6">
                <Link to="/explore" className="btn-ghost">Explore</Link>
                <Link to="/editor" className="btn-ghost">New Research</Link>
                <Link to="/login" className="btn-secondary">Login</Link>
              </nav>
            </div>
          </div>
        </header>
      )}
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;