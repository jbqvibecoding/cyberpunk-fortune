import { ReactNode, useState } from 'react';
import AppSidebar from './AppSidebar';
import { ShieldCheck, Wallet, Menu, ChevronDown, AlertTriangle } from 'lucide-react';
import WalletModal from '@/components/modals/WalletModal';
import { NavLink, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;
              return (
                <div
                  {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}
                  className="flex items-center gap-2"
                >
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      className="cyber-btn-ghost !py-2 !px-3 text-xs"
                      title="可选：仅用于验证发牌公平性"
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline font-cn">连接钱包</span>
                    </button>
                  ) : chain.unsupported ? (
                    <button
                      onClick={openChainModal}
                      className="cyber-btn-ghost !py-2 !px-3 text-xs border-destructive/60 text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-cn">网络错误</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={openChainModal}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-secondary/40 bg-secondary/10 hover:bg-secondary/20 transition-colors font-mono text-[10px] tracking-widest text-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        {chain.name?.toUpperCase()}
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="cyber-btn-ghost !py-2 !px-3 text-xs"
                      >
                        <Wallet className="h-4 w-4" />
                        <span className="font-mono">{account.displayName}</span>
                        {account.displayBalance && (
                          <span className="hidden sm:inline text-muted-foreground font-mono">
                            · {account.displayBalance}
                          </span>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </button>
                    </>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

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
