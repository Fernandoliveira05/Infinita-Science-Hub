import { Link } from "react-router-dom";
import { Search, Filter, GitFork, DollarSign, Clock, User, Hash } from "lucide-react";

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
    description: "Investigating quantum coherence in photosynthetic complexes using advanced spectroscopy techniques."
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
    description: "Novel approaches to gene editing in brain tissue with reduced off-target effects."
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
    description: "Deep learning models predicting protein structures with unprecedented accuracy."
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
    description: "Novel battery technologies using bio-inspired materials for sustainable energy."
  }
];

const Explore = () => {
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'validated':
        return <span className="tag-validated">Validated</span>;
      case 'in-review':
        return <span className="tag-review">In Review</span>;
      case 'free':
        return <span className="tag-free">Free License</span>;
      default:
        return <span className="tag-error">Error</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <Link to="/explore" className="text-primary font-medium">Explore</Link>
              <Link to="/editor" className="btn-ghost">New Research</Link>
              <Link to="/login" className="btn-secondary">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="bg-gray-100 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Explore Scientific Repositories
          </h1>
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search repositories, authors, or topics..."
                className="input-professional pl-12"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn-ghost flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              
              <select className="input-professional max-w-48">
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
              <div key={repo.id} className="card-professional hover:scale-[1.01] transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link 
                          to={`/repository/${repo.id}`}
                          className="text-2xl font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {repo.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {repo.author}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {repo.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono">{repo.hash}</span>
                          </div>
                        </div>
                      </div>
                      {getStatusTag(repo.status)}
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {repo.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <GitFork className="w-4 h-4" />
                        {repo.forks} forks
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        {repo.donations} ETH donated
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={`/repository/${repo.id}`} className="btn-secondary">
                      View Details
                    </Link>
                    <button className="btn-primary">
                      Fork & License
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-12">
            <button className="btn-secondary px-8">
              Load More Repositories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Explore;