import { ReactNode, useState } from 'react';
import AppSidebar from './AppSidebar';
import { ShieldCheck, Wallet, Menu } from 'lucide-react';
import WalletModal from '@/components/modals/WalletModal';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/lobby', label: '大厅' },
  { to: '/table', label: '开始' },
  { to: '/agents', label: '名人图鉴' },
  { to: '/report', label: '我的牌品' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl flex items-center px-4 md:px-8 gap-4">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-md border border-border text-muted-foreground"
            aria-label="菜单"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] tracking-[0.3em] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-secondary">SEPOLIA · ALPHA · v1.0</span>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setWalletOpen(true)}
            className="cyber-btn-ghost !py-2 !px-3 text-xs"
            title="钱包可选，仅用于验证发牌公平性"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">连接钱包</span>
            <span className="hidden md:inline text-[10px] text-muted-foreground normal-case tracking-normal font-cn">
              （仅验证公平性）
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-secondary/40 bg-secondary/10">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
            <span className="font-mono text-[10px] tracking-widest text-secondary">VRF READY</span>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-b border-border/60 bg-card/80 backdrop-blur px-4 py-3 flex flex-wrap gap-2">
            {navItems.map(it => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `font-cn text-sm px-3 py-1.5 rounded-md border ${
                    isActive || pathname === it.to
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`
                }
              >
                {it.label}
              </NavLink>
            ))}
          </div>
        )}

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <WalletModal open={walletOpen} onOpenChange={setWalletOpen} />
    </div>
  );
}
