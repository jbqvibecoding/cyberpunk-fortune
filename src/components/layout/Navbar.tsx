import { useState } from 'react';
import { Menu, X, Spade } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const links = [
  { href: '#games', label: 'LOBBY' },
  { href: '#poker', label: 'PLAY' },
  { href: '#agents', label: 'AGENTS' },
  { href: '#features', label: 'FEATURES' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-purple-gradient flex items-center justify-center glow-purple">
                <Spade className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="font-display text-2xl font-bold tracking-widest">
              <span className="text-glow-cyan text-secondary">AI</span>{' '}
              <span className="text-glow-magenta text-accent">POKER</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="font-display text-sm tracking-[0.2em] text-muted-foreground hover:text-secondary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <ConnectButton chainStatus="icon" showBalance={true} accountStatus="address" />
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-foreground">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-primary/20 flex flex-col gap-4">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display text-sm tracking-widest text-muted-foreground hover:text-secondary py-2">
                {l.label}
              </a>
            ))}
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
