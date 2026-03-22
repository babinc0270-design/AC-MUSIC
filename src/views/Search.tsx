import { useState, useMemo, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import type { Song } from '../types';
import { SongCard } from '../components/SongCard';
import { SearchIcon } from '../components/Icons';

interface SearchProps {
  onAuthRequired: () => void;
}

export default function Search({ onAuthRequired }: SearchProps) {
  const [query, setQuery] = useState('');
  const { songs, loadingSongs } = usePlayer();
  
  // New States for our Dynamic API
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [webResults, setWebResults] = useState<Song[]>([]);

  // 1. Check local database first
  const localResults = useMemo<Song[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => {
      const genreList = Array.isArray(s.genre) ? s.genre : [s.genre];
      return (
        s.title.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.artist.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [query, songs]);

  // 2. The Auto-Fetch Magic Trigger
  useEffect(() => {
    const q = query.trim();
    // If we have a query, BUT local database has 0 results
    if (q && localResults.length === 0) {
      // Wait 1 second after typing stops to prevent spamming the API
      const timer = setTimeout(async () => {
        setIsSearchingWeb(true);
        try {
          // CHANGE THIS URL LATER WHEN YOU HOST THE PYTHON API 24/7
          const response = await fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(q)}`);
          const newSongs = await response.json();
          if (Array.isArray(newSongs)) {
            setWebResults(newSongs); // Injects new songs instantly!
          }
        } catch (error) {
          console.error("API failed to fetch:", error);
        } finally {
          setIsSearchingWeb(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setWebResults([]); // Clear web results if local results are found
    }
  }, [query, localResults.length]);

  // 3. Decide which results to show
  const displayResults = localResults.length > 0 ? localResults : webResults;

  if (loadingSongs) return <div className="p-24 text-center text-zinc-500">Loading Database...</div>;

  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

      <div className="relative mb-8 max-w-xl">
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <SearchIcon className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any song in the world..."
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-full pl-12 pr-5 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition"
        />
      </div>

      {isSearchingWeb ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
           <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="font-bold animate-pulse">Hunting the web for "{query}"...</p>
        </div>
      ) : displayResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayResults.map((song) => (
            <SongCard key={song.id} song={song} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      ) : query && !isSearchingWeb ? (
        <div className="text-center py-24 text-zinc-600">
          <p>No results found anywhere for "{query}"</p>
        </div>
      ) : null}
    </div>
  );
}
