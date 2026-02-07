import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30" />
            </div>
            <span className="font-display text-2xl font-bold tracking-wider text-glow-cyan">
              PIONEER
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#games" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors">
              GAMES
            </a>
            <a href="#powerball" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors">
              POWERBALL
            </a>
            <a href="#poker" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors">
              POKER
            </a>
            <a href="#features" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors">
              FEATURES
            </a>
            <a href="#about" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors">
              ABOUT
            </a>
          </div>

          {/* Wallet Button */}
          <div className="hidden md:block">
            <ConnectButton
              chainStatus="icon"
              showBalance={true}
              accountStatus="address"
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-foreground p-2"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-4">
              <a href="#games" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                GAMES
              </a>
              <a href="#powerball" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                POWERBALL
              </a>
              <a href="#poker" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                POKER
              </a>
              <a href="#features" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                FEATURES
              </a>
              <a href="#about" className="font-display text-sm tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                ABOUT
              </a>
              <div className="mt-2">
                <ConnectButton
                  chainStatus="icon"
                  showBalance={false}
                  accountStatus="address"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
