import { Ticket, Spade, Clock, Trophy, Users, Zap } from 'lucide-react';

const GamesSection = () => {
  return (
    <section id="games" className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-sm text-primary tracking-widest">SELECT YOUR GAME</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 tracking-wider">
            CHOOSE YOUR <span className="text-glow-magenta text-secondary">DESTINY</span>
          </h2>
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Powerball Card */}
          <a href="#powerball" className="group">
            <div className="cyber-card h-full p-8 transition-all duration-500 hover:glow-cyan scanlines relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 group-hover:glow-cyan transition-all duration-500">
                  <Ticket className="h-10 w-10 text-primary" />
                </div>

                {/* Title */}
                <h3 className="font-display text-3xl font-bold mb-4 tracking-wide">
                  CYBER-POWERBALL
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Pick your lucky numbers and enter the decentralized lottery. 
                  Jackpots roll over until won. All draws verified on-chain via Chainlink VRF.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
                    <span className="font-mono text-accent text-lg font-bold">247 ETH</span>
                    <p className="text-xs text-muted-foreground">Jackpot</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="font-mono text-primary text-lg font-bold">12:34:56</span>
                    <p className="text-xs text-muted-foreground">Next Draw</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-secondary mx-auto mb-1" />
                    <span className="font-mono text-secondary text-lg font-bold">4,892</span>
                    <p className="text-xs text-muted-foreground">Tickets</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-primary font-display font-semibold tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                  <span>PLAY NOW</span>
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </div>
          </a>

          {/* Texas Hold'em Card */}
          <a href="#poker" className="group">
            <div className="cyber-card h-full p-8 transition-all duration-500 hover:glow-magenta scanlines relative overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-6 group-hover:glow-magenta transition-all duration-500">
                  <Spade className="h-10 w-10 text-secondary" />
                </div>

                {/* Title */}
                <h3 className="font-display text-3xl font-bold mb-4 tracking-wide">
                  AI POKER DUEL
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Challenge our LLM-powered AI in 1v1 Texas Hold'em. 
                  Provably fair card dealing with Chainlink VRF. Real-time AI decisions via Chainlink Functions.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Zap className="h-5 w-5 text-accent mx-auto mb-1" />
                    <span className="font-mono text-accent text-lg font-bold">&lt;10s</span>
                    <p className="text-xs text-muted-foreground">AI Response</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                    <span className="font-mono text-primary text-lg font-bold">0.1-10</span>
                    <p className="text-xs text-muted-foreground">ETH Stakes</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-secondary mx-auto mb-1" />
                    <span className="font-mono text-secondary text-lg font-bold">127</span>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-secondary font-display font-semibold tracking-wide group-hover:translate-x-2 transition-transform duration-300">
                  <span>ENTER LOBBY</span>
                  <Zap className="h-5 w-5" />
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default GamesSection;
