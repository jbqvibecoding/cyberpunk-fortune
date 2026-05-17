import { ArrowRight, Cpu, Shield, Zap } from 'lucide-react';
import heroCity from '@/assets/hero-city.jpg';
import { AGENTS } from '@/lib/agents';

const HeroSection = () => {
  const spotlight = AGENTS[0];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 cyber-grid opacity-30" />
      <div className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-[28rem] h-[28rem] bg-accent/20 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/40 bg-secondary/10">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-xs tracking-[0.3em] text-secondary">SEPOLIA · LIVE · v1.0</span>
            </div>

            <h1 className="font-display font-black tracking-tighter leading-[0.95]">
              <span className="block text-5xl md:text-7xl xl:text-8xl text-glow-cyan text-foreground">AI AGENT</span>
              <span className="block text-5xl md:text-7xl xl:text-8xl bg-clip-text text-transparent bg-purple-gradient">POKER</span>
              <span className="block mt-3 text-base md:text-lg font-mono tracking-[0.4em] text-muted-foreground">
                WEB3 + AI AGENT · 德州扑克游戏
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              The future is now. Intelligent agents play for you, with you, against you.{' '}
              <span className="text-secondary">Provably fair.</span>{' '}
              <span className="text-accent">Fully on-chain.</span>
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#games" className="cyber-btn-primary text-base">
                <Zap className="h-4 w-4" /> PLAY NOW
              </a>
              <a href="#agents" className="cyber-btn-neon text-base">
                MEET THE AGENTS <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 max-w-xl">
              <div className="cyber-card p-4">
                <Shield className="h-5 w-5 text-secondary mb-2" />
                <div className="font-display text-xs tracking-widest">CHAINLINK VRF</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">Verifiable Random</div>
              </div>
              <div className="cyber-card p-4">
                <Cpu className="h-5 w-5 text-accent mb-2" />
                <div className="font-display text-xs tracking-widest">LLM AGENTS</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">Onchain Strategy</div>
              </div>
              <div className="cyber-card p-4">
                <Zap className="h-5 w-5 text-primary mb-2" />
                <div className="font-display text-xs tracking-widest">INSTANT PAYOUT</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">Smart Settlement</div>
              </div>
            </div>
          </div>

          {/* Right: hero visual */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="cyber-card-neon overflow-hidden">
                <img
                  src={heroCity}
                  alt="Cyberpunk poker city skyline"
                  className="w-full h-[460px] object-cover"
                  width={1024}
                  height={1280}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded bg-background/70 border border-secondary/40 font-mono text-[10px] tracking-widest text-secondary">
                  AI AGENT SPOTLIGHT
                </div>
              </div>

              {/* Floating agent card */}
              <div className="absolute -bottom-6 -left-6 cyber-card-neon p-4 w-64 backdrop-blur-xl animate-float" style={{ borderColor: 'hsl(var(--accent) / 0.6)' }}>
                <div className="flex items-center gap-3">
                  <img src={spotlight.portrait} alt={spotlight.name} className="w-14 h-14 rounded-lg object-cover bg-muted" loading="lazy" />
                  <div>
                    <div className="font-display text-sm text-accent text-glow-magenta">{spotlight.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{spotlight.tier}</div>
                    <div className="mt-1 text-xs"><span className="text-muted-foreground">WIN </span><span className="text-secondary font-mono font-bold">{spotlight.winRate}%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
