import { useState, useMemo } from 'react';
import { SONGS } from '../data';
import { Song } from '../types';
import { SongCard } from '../components/SongCard';
import { SearchIcon } from '../components/Icons';

interface SearchProps {
  onAuthRequired: () => void;
}

export default function Search({ onAuthRequired }: SearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo<Song[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SONGS;
    return SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.artist.some((a) => a.toLowerCase().includes(q)) ||
        s.genre.some((g) => g.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="px-4 md:px-8 py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

      {/* Search Input */}
      <div className="relative mb-8 max-w-xl">
        <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <SearchIcon className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums, genres…"
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-full pl-12 pr-5 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-white transition text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Results count */}
      {query && (
        <p className="text-zinc-400 text-sm mb-4">
          {results.length === 0
            ? 'No results found'
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {/* Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {results.map((song) => (
            <SongCard key={song.id} song={song} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <SearchIcon className="w-14 h-14 mb-4" />
          <p className="text-lg font-medium text-zinc-400">No songs found</p>
          <p className="text-sm mt-1">Try a different keyword</p>
        </div>
      )}
    </div>
  );
}
