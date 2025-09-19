import { Link } from "react-router-dom";
import { ArrowRight, Beaker, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-science.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 gradient-hero opacity-90"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white">
          <div className="animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Beaker className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                  Infinita Science Hub
                </h1>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl mb-4 text-white/90 max-w-4xl mx-auto leading-relaxed">
              The main research field of Infinita City
            </p>
            
            <p className="text-lg md:text-xl mb-12 text-white/80 max-w-3xl mx-auto">
              Where students, researchers, and innovators publish, explore, and license scientific projects in a professional collaborative environment.
            </p>

            <Link
              to="/explore"
              className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Enter the Platform
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              About the Platform
            </h2>
            <p className="text-xl text-gray-500 max-w-4xl mx-auto leading-relaxed">
              A collaborative environment where science is built step by step using proof blocks, 
              validated by AI, and protected by blockchain technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-professional text-center animate-slide-up">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Structured Research
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Build scientific proofs using interconnected blocks of evidence, 
                creating clear and verifiable research workflows.
              </p>
            </div>

            <div className="card-professional text-center animate-slide-up">
              <div className="w-16 h-16 bg-blue/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                AI Validation
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Advanced AI systems review and validate research blocks, 
                ensuring scientific rigor and accuracy in every publication.
              </p>
            </div>

            <div className="card-professional text-center animate-slide-up">
              <div className="w-16 h-16 bg-yellow/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Beaker className="w-8 h-8 text-yellow" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Blockchain Protection
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Research is secured and timestamped on blockchain, 
                protecting intellectual property and enabling transparent licensing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;