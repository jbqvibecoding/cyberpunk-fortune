import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import GamesSection from '@/components/sections/GamesSection';
import PowerballGame from '@/components/games/PowerballGame';
import PokerGame from '@/components/games/PokerGame';
import Footer from '@/components/sections/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <GamesSection />
      <PowerballGame />
      <PokerGame />
      <Footer />
    </div>
  );
};

export default Index;
