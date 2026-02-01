import { Zap, Github, Twitter, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="about" className="py-16 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Zap className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 blur-lg bg-primary/30" />
              </div>
              <span className="font-display text-2xl font-bold tracking-wider">PIONEER</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              The next generation of decentralized gaming. Provably fair lottery and AI-powered poker 
              on Ethereum, powered by Chainlink VRF and Oracle Functions.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-sm tracking-wider mb-4 text-muted-foreground">GAMES</h4>
            <ul className="space-y-3">
              <li>
                <a href="#powerball" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  Cyber-Powerball
                </a>
              </li>
              <li>
                <a href="#poker" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  AI Poker Duel
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  Coming Soon...
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-sm tracking-wider mb-4 text-muted-foreground">RESOURCES</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  Smart Contracts
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-foreground hover:text-primary transition-colors flex items-center gap-2">
                  Etherscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>© 2026 Pioneer Protocol</span>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Powered by</span>
            <span className="text-primary font-display">Ethereum</span>
            <span className="text-muted-foreground">+</span>
            <span className="text-secondary font-display">Chainlink</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
