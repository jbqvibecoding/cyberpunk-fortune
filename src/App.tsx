import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import LobbyPage from "@/pages/LobbyPage";
import AgentsPage from "@/pages/AgentsPage";
import TablePage from "@/pages/TablePage";
import ReportPage from "@/pages/ReportPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/lobby" replace />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/table" element={<TablePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/history" element={<PlaceholderPage title="历史" hint="你的对局历史与可验证发牌存档将在这里呈现。" />} />
              <Route path="/settings" element={<PlaceholderPage title="设置" hint="主题、语言、声音和键位等设置。" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
