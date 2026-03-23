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
import { ViewType } from './types';
import { useAuth } from './context/AuthContext';

// ADDED: Import your brand new Library component!
import { YourLibrary } from './components/YourLibrary'; 

function AppShell() {
  const { user, loading } = useAuth(); // <--- Make sure "user" is inside these curly braces
  const [currentView, setCurrentView] = useState<ViewType>('home');

  const navigate = (view: ViewType) => setCurrentView(view);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'search':
        return <Search onAuthRequired={() => navigate('auth')} />;
      case 'liked':
        // UPDATED: Now renders the new YourLibrary screen!
        return <YourLibrary />; 
      case 'auth':
        return <Auth onSuccess={() => navigate('home')} />;
      case 'profile':
        return <Profile onSignOut={() => navigate('home')} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  // Auth view is full-screen (no sidebar/player)
  // Only show the full-screen Auth page if we aren't already home
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
      {/* Sidebar — desktop only */}
      <Sidebar
        currentView={currentView}
        onNavigate={navigate}
        isAuthenticated={!!user}
      />

      {/* Main scrollable area */}
      <main className="flex-1 md:ml-60 overflow-y-auto pb-36 md:pb-24 scrollbar-none">
        {renderView()}
      </main>

      {/* Fixed player bar */}
      <Player />

      {/* Mobile bottom nav */}
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
