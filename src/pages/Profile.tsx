import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { User, MapPin, Calendar, GitFork, DollarSign, Star, Settings, Plus } from "lucide-react";

const Profile = () => {
  const { userId } = useParams();
  
  // Mock user data
  const user = {
    name: "Dr. Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    bio: "Quantum physicist specializing in biological systems. Passionate about bridging the gap between quantum mechanics and life sciences through innovative research methodologies.",
    location: "Infinita City, Research District",
    joinDate: "March 2023",
    stats: {
      researches: 12,
      forks: 156,
      donations: 8.4,
      followers: 284
    },
    repositories: [
      {
        id: "1",
        title: "Quantum Entanglement in Biological Systems",
        status: "validated",
        forks: 23,
        donations: 1.2,
        updatedAt: "2 days ago"
      },
      {
        id: "2",
        title: "Photosynthetic Quantum Coherence Studies",
        status: "in-review", 
        forks: 8,
        donations: 0.5,
        updatedAt: "1 week ago"
      },
      {
        id: "3",
        title: "Bio-inspired Quantum Computing Models",
        status: "validated",
        forks: 34,
        donations: 2.1,
        updatedAt: "2 weeks ago"
      }
    ]
  };

  const [activeTab, setActiveTab] = useState("repositories");

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
              <Link to="/explore" className="btn-ghost">Explore</Link>
              <Link to="/editor" className="btn-ghost">New Research</Link>
              <button className="btn-ghost flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="card-professional mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-4 shadow-lg">
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {user.name}
                </h1>
                
                <div className="flex flex-col gap-2 text-gray-500 mb-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {user.joinDate}</span>
                  </div>
                </div>
                
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Follow Researcher
                </button>
              </div>
            </div>

            {/* Bio and Stats */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">
                  {user.bio}
                </p>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Research Focus:</strong> Your profile is your scientific portfolio inside Infinita City.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {user.stats.researches}
                  </div>
                  <div className="text-sm text-gray-500">Researches</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {user.stats.forks}
                  </div>
                  <div className="text-sm text-gray-500">Forks</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {user.stats.donations} ETH
                  </div>
                  <div className="text-sm text-gray-500">Donations</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {user.stats.followers}
                  </div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-professional">
          <div className="border-b border-border mb-6">
            <nav className="flex space-x-8">
              {["repositories", "activity", "contributions"].map((tab) => (
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

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === "repositories" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-foreground">Research Repositories</h3>
                  <Link to="/editor" className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Research
                  </Link>
                </div>

                <div className="grid gap-6">
                  {user.repositories.map((repo) => (
                    <div key={repo.id} className="border border-border rounded-xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Link
                            to={`/repository/${repo.id}`}
                            className="text-xl font-bold text-foreground hover:text-primary transition-colors"
                          >
                            {repo.title}
                          </Link>
                          <p className="text-gray-500 text-sm mt-1">
                            Updated {repo.updatedAt}
                          </p>
                        </div>
                        {getStatusTag(repo.status)}
                      </div>
                      
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
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Recent Activity</h3>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Activity feed will show research updates, forks, and collaborations.</p>
                  <p className="text-sm text-gray-400">Feature coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === "contributions" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Contributions</h3>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">View contributions to other researchers' work and collaborative projects.</p>
                  <p className="text-sm text-gray-400">Feature coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;