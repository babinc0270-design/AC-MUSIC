import React, { useState, useMemo } from 'react';
import { usePlayer } from '../context/PlayerContext';
import type { Song } from '../types';
import { SongCard } from '../components/SongCard';
import { SearchIcon } from '../components/Icons';

interface SearchProps {
  onAuthRequired: () => void;
}

export default function Search({ onAuthRequired }: SearchProps) {
  const [query, setQuery] = useState('');
  
  // 1. Grab the live database songs from the brain!
  const { songs, loadingSongs } = usePlayer();

  // 2. Search through the live database safely
  const results = useMemo<Song[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) => {
      const genreList = Array.isArray(s.genre) ? s.genre : [s.genre];
      return (
        s.title.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.artist.some((a) => a.toLowerCase().includes(q)) ||
        genreList.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [query, songs]);

  // 3. Show a sleek loading screen while Firebase connects
  if (loadingSongs) {
    return (
      <div className="px-4 md:px-8 py-24 flex items-center justify-center">
        <div className="text-zinc-400 text-lg font-medium flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          Searching Database... 🎧
        </div>
      </div>
    );
  }

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
