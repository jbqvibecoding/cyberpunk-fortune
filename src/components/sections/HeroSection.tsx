import { ArrowDown, Shield, Cpu, Sparkles } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow delay-1000" />

      {/* Scan Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-sm text-primary">SEPOLIA TESTNET • LIVE</span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-wider animate-slide-up">
            <span className="text-glow-cyan">NEXT-GEN</span>
            <br />
            <span className="bg-clip-text text-transparent bg-neon-gradient">WEB3 GAMING</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground font-body mb-12 max-w-2xl mx-auto animate-slide-up delay-100">
            Provably fair lottery & AI-powered poker on the blockchain. 
            <span className="text-primary"> Transparent.</span>
            <span className="text-secondary"> Secure.</span>
            <span className="text-accent"> Revolutionary.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up delay-200">
            <a href="#games" className="cyber-btn-primary text-lg">
              Start Playing
            </a>
            <a href="#about" className="cyber-btn-secondary text-lg">
              How It Works
            </a>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-300">
            <div className="cyber-card p-6 flex items-center gap-4 glitch-hover">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-lg font-semibold">Chainlink VRF</h3>
                <p className="text-sm text-muted-foreground">Verifiable Randomness</p>
              </div>
            </div>

            <div className="cyber-card p-6 flex items-center gap-4 glitch-hover">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center glow-magenta">
                <Cpu className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-lg font-semibold">AI Opponent</h3>
                <p className="text-sm text-muted-foreground">LLM-Powered Strategy</p>
              </div>
            </div>

            <div className="cyber-card p-6 flex items-center gap-4 glitch-hover">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center glow-yellow">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <h3 className="font-display text-lg font-semibold">Instant Payouts</h3>
                <p className="text-sm text-muted-foreground">Smart Contract Settlement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-primary/50" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
