import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, GitFork, DollarSign, Share, Download, User, Clock, Hash, ExternalLink } from "lucide-react";

const Repository = () => {
  const { id } = useParams();
  
  // Mock repository data
  const repository = {
    title: "Quantum Entanglement in Biological Systems",
    author: "Dr. Sarah Chen",
    date: "2024-03-15",
    hash: "0x1a2b3c4d5e6f7890abcdef",
    status: "validated",
    forks: 23,
    donations: 1.2,
    description: "This research investigates quantum coherence in photosynthetic complexes using advanced spectroscopy techniques. We explore the role of quantum entanglement in biological energy transfer processes.",
    blocks: 12,
    references: 8,
    license: "Creative Commons Attribution 4.0"
  };

  const [activeTab, setActiveTab] = useState("blocks");
  
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
              <Link to="/login" className="btn-secondary">Login</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>

        {/* Repository Header */}
        <div className="card-professional mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold text-foreground">
                  {repository.title}
                </h1>
                <span className="tag-validated">Validated</span>
              </div>
              
              <div className="flex items-center gap-6 mb-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{repository.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{repository.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  <span className="font-mono text-sm">{repository.hash}</span>
                </div>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {repository.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>{repository.blocks} proof blocks</span>
                <span>{repository.references} references</span>
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4" />
                  {repository.forks} forks
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {repository.donations} ETH donated
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 min-w-48">
              <button className="btn-primary flex items-center justify-center gap-2">
                <GitFork className="w-4 h-4" />
                Fork Repository
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2">
                <Share className="w-4 h-4" />
                Cite Research
              </button>
              <button className="btn-ghost flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button className="btn-danger flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                Donate ETH
              </button>
            </div>
          </div>
        </div>

        {/* Intro Text */}
        <div className="mb-8 p-6 bg-blue/5 border border-blue/20 rounded-xl">
          <p className="text-blue-600">
            <strong>Research Repository:</strong> This repository contains structured scientific proof blocks. Navigate tabs to see details about the research methodology, references, licensing terms, and community discussions.
          </p>
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

          {/* Tab Content */}
          <div className="min-h-96">
            {activeTab === "blocks" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground mb-6">Proof Blocks Structure</h3>
                <div className="grid gap-4">
                  {Array.from({length: 6}, (_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">Block {i + 1}: Research Methodology</h4>
                          <p className="text-gray-500 text-sm">Text block containing experimental procedures and protocols</p>
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="font-mono">#{(i + 1).toString().padStart(3, '0')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "references" && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground mb-6">References & Citations</h3>
                <div className="space-y-4">
                  {Array.from({length: 8}, (_, i) => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <span className="text-sm text-gray-400 font-mono">[{i + 1}]</span>
                        <div className="flex-1">
                          <p className="text-foreground mb-2">
                            Research Article Title Here - Journal of Advanced Studies, 2024
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>DOI: 10.1000/123456</span>
                            <a href="#" className="flex items-center gap-1 text-primary hover:text-primary-hover">
                              <ExternalLink className="w-3 h-3" />
                              View External
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "license" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground mb-6">License Information</h3>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    {repository.license}
                  </h4>
                  <p className="text-green-700 dark:text-green-400 text-sm leading-relaxed">
                    This work is licensed under Creative Commons Attribution 4.0 International License. 
                    You are free to share and adapt the material for any purpose, even commercially, 
                    under the following terms: You must give appropriate credit, provide a link to the license, 
                    and indicate if changes were made.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Commercial Licensing Options</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-border rounded-lg p-4">
                      <h5 className="font-medium text-foreground mb-2">Academic Use</h5>
                      <p className="text-gray-500 text-sm mb-3">Free for educational and research purposes</p>
                      <span className="tag-free">Free License</span>
                    </div>
                    <div className="border border-border rounded-lg p-4">
                      <h5 className="font-medium text-foreground mb-2">Commercial Use</h5>
                      <p className="text-gray-500 text-sm mb-3">Extended license for commercial applications</p>
                      <span className="text-primary font-semibold">0.5 ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "discussions" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground mb-6">Community Discussions</h3>
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No discussions yet for this repository.</p>
                  <button className="btn-primary">Start a Discussion</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repository;