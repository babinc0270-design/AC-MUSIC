import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Player } from './components/Player';
import { Home } from './views/Home';
import Search from './views/Search';
import Auth from './views/Auth';
import Profile from './views/Profile';
import { YourLibrary } from './views/YourLibrary'; 
import { ArtistPage } from './views/ArtistPage'; // NEW: Imported your Artist Page
import type { ViewType } from './types';
import { useAuth } from './context/AuthContext';

function AppShell() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('home');
  // NEW State: Hold the target artist for the page
  const [targetArtist, setTargetArtist] = useState<string | null>(null);

  const navigate = (view: ViewType) => setCurrentView(view);

  // NEW callback for opening an artist page
  const openArtistPage = (artistName: string) => {
    setTargetArtist(artistName);
    setCurrentView('artist' as ViewType); // We're using a temp view type here
  };

  const renderView = () => {
    // Handling a temp view type 'artist'
    if ((currentView as string) === 'artist' && targetArtist) {
      return <ArtistPage artistName={targetArtist} onBack={() => navigate('home')} />
    }

    switch (currentView) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'search':
        return <Search onAuthRequired={() => navigate('auth')} />;
      case 'liked':
        return <YourLibrary />; 
      case 'auth':
        return <Auth onSuccess={() => navigate('home')} />;
      case 'profile':
        return <Profile onSignOut={() => navigate('home')} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  if (currentView === 'auth') {
    return (
      <Auth
        onSuccess={() => {
          console.log('Login Success!');
          navigate('home');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        isAuthenticated={!!user}
      />

      <main className="flex-1 md:ml-60 overflow-y-auto pb-36 md:pb-24 scrollbar-none">
        {renderView()}
      </main>

      {/* NEW prop passed to the player! */}
      <Player onArtistClick={openArtistPage} />

      <MobileNav 
        currentView={currentView} 
        onNavigate={navigate}
        isAuthenticated={!!user} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppShell />
      </PlayerProvider>
    </AuthProvider>
  );
}
