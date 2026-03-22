import React, { useState, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { SongCard } from '../components/SongCard';
import type { ViewType } from '../types';

interface HomeProps {
  onNavigate: (view: ViewType) => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home({ onNavigate }: HomeProps) {
  const [activeGenre, setActiveGenre] = useState<string>('All');
  
  // 1. Grab the live database songs from the brain!
  const { songs, loadingSongs } = usePlayer(); 

  // 2. Safely extract genres (handles both arrays and single strings)
  const genres = useMemo<string[]>(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      const genreList = Array.isArray(s.genre) ? s.genre : [s.genre];
      genreList.forEach((g) => set.add(g || 'Unknown'));
    });
    return ['All', ...Array.from(set).sort()];
  }, [songs]);

  // 3. Filter the live songs based on the selected genre
  const filteredSongs = useMemo(() => {
    if (activeGenre === 'All') return songs;
    return songs.filter((s) => {
      const genreList = Array.isArray(s.genre) ? s.genre : [s.genre];
      return genreList.includes(activeGenre);
    });
  }, [activeGenre, songs]);

  // 4. Show a sleek loading screen while Firebase connects
  if (loadingSongs) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-zinc-800/60 via-zinc-950 to-black">
        <div className="text-zinc-400 text-lg font-medium flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          Loading Live Music... 🎧
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-800/60 via-zinc-950 to-black">
      {/* Hero header */}
      <div className="relative px-6 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Discover & stream your next favorite track
          </p>
        </div>
      </div>

      {/* Genre filter pills */}
      <div className="px-6 pb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                activeGenre === genre
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Song grid */}
      <div className="px-6 pb-8">
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-base font-bold text-white">
            {activeGenre === 'All' ? 'All Songs' : activeGenre}
          </h2>
          <span className="text-zinc-600 text-sm">
            {filteredSongs.length} track{filteredSongs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onAuthRequired={() => onNavigate('auth')}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500 font-medium">
              No tracks found for "{activeGenre}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
